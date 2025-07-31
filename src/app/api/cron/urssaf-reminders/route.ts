import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";

const getUrssafRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 0.128; // 12.8%
    case "PRESTATAIRE": return 0.22; // 22%
    case "LIBERAL": return 0.22; // 22%
    default: return 0;
  }
};

const getTvaThreshold = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 91900; // Commercial activities
    case "PRESTATAIRE": return 36800; // Service activities (BIC)
    case "LIBERAL": return 36800; // Liberal activities (BNC)
    default: return 0;
  }
};

// Helper to create in-app notifications with retry logic
const createNotification = async (
  userId: string, 
  type: 'URSSAF_REMINDER' | 'TVA_THRESHOLD_WARNING' | 'TVA_THRESHOLD_EXCEEDED',
  title: string,
  message: string,
  actionUrl?: string,
  metadata?: Record<string, unknown>
) => {
  const result = await NotificationService.queueNotification({
    userId,
    type,
    title,
    message,
    actionUrl,
    metadata,
    maxAttempts: 5
  });

  if (!result.success) {
    console.error(`[URSSAF Reminders] Failed to queue notification for user ${userId}:`, result.error);
    
    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          actionUrl,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        },
      });
      console.log(`[URSSAF Reminders] Fallback: Created notification directly for user ${userId}`);
    } catch (fallbackError) {
      console.error(`[URSSAF Reminders] Fallback failed for user ${userId}:`, fallbackError);
      throw fallbackError;
    }
  } else {
    console.log(`[URSSAF Reminders] Successfully queued notification ${result.queueItemId} for user ${userId}`);
  }
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        fiscalRegime: { in: ["MicroBIC", "BNC"] },
        microEntrepreneurType: { not: null },
      },
      select: { 
        id: true, 
        name: true, 
        email: true,
        fiscalRegime: true, 
        microEntrepreneurType: true,
        tvaNumber: true,
        invoices: { 
          select: { 
            totalAmount: true, 
            invoiceDate: true,
            status: true,
          } 
        },
        receivedSubInvoices: {
          select: {
            amount: true,
            createdAt: true,
            paymentStatus: true,
          }
        }
      },
    });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    for (const user of users) {
      if (!user.microEntrepreneurType) continue;

      // Calculate annual turnover from paid invoices
      const paidInvoiceTurnover = user.invoices.reduce((sum, invoice) => {
        const invoiceYear = new Date(invoice.invoiceDate).getFullYear();
        if (invoiceYear === currentYear && invoice.status === 'paid') {
          return sum + parseFloat(invoice.totalAmount.toString());
        }
        return sum;
      }, 0);

      // Calculate annual turnover from paid sub-invoices
      const paidSubInvoiceTurnover = user.receivedSubInvoices.reduce((sum, subInvoice) => {
        const subInvoiceYear = new Date(subInvoice.createdAt).getFullYear();
        if (subInvoiceYear === currentYear && subInvoice.paymentStatus === 'paid') {
          return sum + parseFloat(subInvoice.amount.toString());
        }
        return sum;
      }, 0);

      const cumulativeTurnover = paidInvoiceTurnover + paidSubInvoiceTurnover;
      
      // Skip users with no turnover
      if (cumulativeTurnover === 0) continue;

      const urssafRate = getUrssafRate(user.microEntrepreneurType);
      const estimatedUrssaf = cumulativeTurnover * urssafRate;

      // Send quarterly reminders (March, June, September, December)
      if (currentMonth === 2 || currentMonth === 5 || currentMonth === 8 || currentMonth === 11) {
        const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
        const currentQuarter = quarterNames[Math.floor(currentMonth / 3)];
        
        // Check if notification already sent this month to avoid duplicates
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'URSSAF_REMINDER',
            createdAt: {
              gte: new Date(currentYear, currentMonth, 1),
              lt: new Date(currentYear, currentMonth + 1, 1),
            },
          },
        });

        if (!existingNotification) {
          try {
            await createNotification(
              user.id,
              'URSSAF_REMINDER',
              `📊 Rappel déclaration URSSAF ${currentQuarter}`,
              `Pensez à faire votre déclaration trimestrielle ! CA annuel: ${cumulativeTurnover.toFixed(2)}€, URSSAF estimé: ${estimatedUrssaf.toFixed(2)}€`,
              '/dashboard/reports',
              {
                quarter: currentQuarter,
                cumulativeTurnover,
                estimatedUrssaf,
                reminderType: 'quarterly'
              }
            );
            console.log(`📧 Created quarterly URSSAF reminder for ${user.name || user.email}`);
          } catch (error) {
            console.error(`❌ Failed to create quarterly URSSAF reminder for ${user.name || user.email}:`, error);
          }
        }
      } 
      // Send monthly reminders (every month except January)
      else if (currentMonth !== 0) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const currentMonthName = monthNames[currentMonth];
        
        // Check if notification already sent this month
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'URSSAF_REMINDER', 
            createdAt: {
              gte: new Date(currentYear, currentMonth, 1),
              lt: new Date(currentYear, currentMonth + 1, 1),
            },
          },
        });

        if (!existingNotification) {
          try {
            await createNotification(
              user.id,
              'URSSAF_REMINDER',
              `📅 Rappel déclaration URSSAF ${currentMonthName}`,
              `N'oubliez pas votre déclaration mensuelle ! CA annuel: ${cumulativeTurnover.toFixed(2)}€, URSSAF estimé: ${estimatedUrssaf.toFixed(2)}€`,
              '/dashboard/reports',
              {
                month: currentMonthName,
                cumulativeTurnover,
                estimatedUrssaf,
                reminderType: 'monthly'
              }
            );
            console.log(`📧 Created monthly URSSAF reminder for ${user.name || user.email}`);
          } catch (error) {
            console.error(`❌ Failed to create monthly URSSAF reminder for ${user.name || user.email}:`, error);
          }
        }
      }

      // TVA threshold monitoring
      const tvaThreshold = getTvaThreshold(user.microEntrepreneurType);
      const tvaThresholdWarning = tvaThreshold * 0.8;

      // TVA threshold exceeded alert
      if (cumulativeTurnover >= tvaThreshold && !user.tvaNumber) {
        // Check if alert already sent this year
        const existingAlert = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'TVA_THRESHOLD_EXCEEDED',
            createdAt: {
              gte: new Date(currentYear, 0, 1),
              lt: new Date(currentYear + 1, 0, 1),
            },
          },
        });

        if (!existingAlert) {
          try {
            await createNotification(
              user.id,
              'TVA_THRESHOLD_EXCEEDED',
              '🚨 URGENT: Seuil TVA dépassé !',
              `Votre CA annuel (${cumulativeTurnover.toFixed(2)}€) dépasse le seuil TVA (${tvaThreshold.toLocaleString()}€). Vous devez vous enregistrer à la TVA immédiatement.`,
              '/dashboard/profile',
              { 
                threshold: tvaThreshold, 
                currentCA: cumulativeTurnover,
                overageAmount: cumulativeTurnover - tvaThreshold
              }
            );
            console.log(`🚨 Created TVA threshold EXCEEDED alert for ${user.name || user.email}`);
          } catch (error) {
            console.error(`❌ Failed to create TVA threshold EXCEEDED alert for ${user.name || user.email}:`, error);
          }
        }
      } 
      // TVA threshold approaching warning
      else if (cumulativeTurnover >= tvaThresholdWarning && cumulativeTurnover < tvaThreshold && !user.tvaNumber) {
        // Check if warning already sent this quarter
        const currentQuarter = Math.floor(currentMonth / 3);
        const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
        const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 1);
        
        const existingWarning = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'TVA_THRESHOLD_WARNING',
            createdAt: {
              gte: quarterStart,
              lt: quarterEnd,
            },
          },
        });

        if (!existingWarning) {
          try {
            const percentage = ((cumulativeTurnover / tvaThreshold) * 100).toFixed(1);
            await createNotification(
              user.id,
              'TVA_THRESHOLD_WARNING',
              '⚠️ Seuil TVA proche',
              `Attention: vous êtes à ${percentage}% du seuil TVA (${cumulativeTurnover.toFixed(2)}€/${tvaThreshold.toLocaleString()}€). Préparez-vous à devenir redevable de la TVA.`,
              '/dashboard/reports',
              { 
                threshold: tvaThreshold, 
                currentCA: cumulativeTurnover, 
                percentage: parseFloat(percentage),
                remainingAmount: tvaThreshold - cumulativeTurnover
              }
            );
            console.log(`⚠️ Created TVA threshold WARNING for ${user.name || user.email} (${percentage}%)`);
          } catch (error) {
            console.error(`❌ Failed to create TVA threshold WARNING for ${user.name || user.email}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      message: "URSSAF reminders and TVA alerts processed successfully",
      processedUsers: users.length,
      currentMonth: currentMonth,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error processing URSSAF reminders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
