import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get URSSAF rates based on micro-entrepreneur type
const getUrssafRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case 'COMMERCANT': return 0.128; // 12.8%
    case 'PRESTATAIRE': return 0.22; // 22%
    case 'LIBERAL': return 0.22; // 22%
    default: return 0;
  }
};

// Helper to get Income Tax rates (versement libératoire)
const getIncomeTaxRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case 'COMMERCANT': return 0.01; // 1%
    case 'PRESTATAIRE': return 0.017; // 1.7%
    case 'LIBERAL': return 0.022; // 2.2%
    default: return 0;
  }
};

// Helper to get TVA thresholds (2024 values)
const getTvaThreshold = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case 'COMMERCANT': return 91900; // Commercial activities
    case 'PRESTATAIRE': return 36800; // Service activities (BIC)
    case 'LIBERAL': return 36800; // Liberal activities (BNC)
    default: return 0;
  }
};

// Helper to create in-app notifications
const createNotification = async (
  userId: string, 
  type: 'URSSAF_REMINDER' | 'TVA_THRESHOLD_WARNING' | 'TVA_THRESHOLD_EXCEEDED',
  title: string,
  message: string,
  actionUrl?: string,
  metadata?: any
) => {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      actionUrl,
      metadata,
    },
  });
};

export async function GET(request: Request) {
  // Check for authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        declarationFrequency: { in: ['monthly', 'quarterly'] },
        fiscalRegime: { in: ['MicroBIC', 'BNC'] },
        microEntrepreneurType: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        siret: true,
        fiscalRegime: true,
        microEntrepreneurType: true,
        declarationFrequency: true,
        tvaNumber: true,
      },
    });

    for (const user of users) {
      if (!user.microEntrepreneurType || !user.declarationFrequency) {
        continue;
      }

      const now = new Date();
      let startDate: Date, endDate: Date;

      // Calculate period dates based on declaration frequency
      if (user.declarationFrequency === 'monthly') {
        // Generate report for previous month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else { // quarterly
        // Generate report for previous quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const previousQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const yearForQuarter = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        
        startDate = new Date(yearForQuarter, previousQuarter * 3, 1);
        endDate = new Date(yearForQuarter, (previousQuarter + 1) * 3, 0);
      }

      // Check if report already exists for this period
      const existingReport = await prisma.urssafReport.findFirst({
        where: {
          userId: user.id,
          periodStartDate: startDate,
          periodEndDate: endDate,
        },
      });

      if (existingReport) {
        continue; // Skip if report already exists
      }

      // Get revenue from paid invoices in the period
      const userInvoices = await prisma.invoice.findMany({
        where: {
          userId: user.id,
          status: 'paid',
          payments: {
            some: {
              paidAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        select: { totalAmount: true },
      });

      // Get revenue from received sub-invoices in the period  
      const userSubInvoices = await prisma.subInvoice.findMany({
        where: {
          receiverId: user.id,
          paymentStatus: 'paid',
          // Use creation date for sub-invoices as they represent work completed
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { amount: true },
      });

      // Calculate total revenue
      let caTotal = 0;
      userInvoices.forEach((invoice) => {
        caTotal += parseFloat(invoice.totalAmount.toString());
      });
      userSubInvoices.forEach((subInvoice) => {
        caTotal += parseFloat(subInvoice.amount.toString());
      });

      // Skip if no revenue for this period
      if (caTotal === 0) {
        continue;
      }

      // Calculate URSSAF contributions and taxes
      const urssafRate = getUrssafRate(user.microEntrepreneurType);
      const incomeTaxRate = getIncomeTaxRate(user.microEntrepreneurType);
      
      const cotisations = caTotal * urssafRate;
      const impotRevenu = caTotal * incomeTaxRate;
      const revenuNet = caTotal - cotisations - impotRevenu;

      // Check TVA threshold status
      const tvaThreshold = getTvaThreshold(user.microEntrepreneurType);
      const tvaApplicable = caTotal >= tvaThreshold;
      
      let alerte = 'Sous seuil de TVA';
      if (tvaApplicable) {
        alerte = 'Seuil TVA dépassé - TVA applicable';
      } else if (caTotal >= tvaThreshold * 0.8) {
        alerte = 'Proche du seuil TVA (80% atteint)';
      }

      // Calculate next declaration deadline
      const nextDeclarationDate = new Date(endDate);
      nextDeclarationDate.setMonth(nextDeclarationDate.getMonth() + 1);
      nextDeclarationDate.setDate(20); // Declaration deadline is 20th of following month
      
      const declarationType = user.declarationFrequency === 'monthly' ? 'mensuelle' : 'trimestrielle';
      const message = `Déclaration ${declarationType} à effectuer avant le ${nextDeclarationDate.toLocaleDateString('fr-FR')}`;

      // Prepare report data
      const reportData = {
        period: `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`,
        user: {
          name: user.name,
          siret: user.siret,
          fiscalRegime: user.fiscalRegime,
          microEntrepreneurType: user.microEntrepreneurType,
        },
        caTotal: parseFloat(caTotal.toFixed(2)),
        tauxUrssaf: parseFloat((urssafRate * 100).toFixed(1)),
        cotisations: parseFloat(cotisations.toFixed(2)),
        tauxImpot: parseFloat((incomeTaxRate * 100).toFixed(1)),
        impotRevenu: parseFloat(impotRevenu.toFixed(2)),
        revenuNet: parseFloat(revenuNet.toFixed(2)),
        tvaApplicable,
        alerte,
        message,
        disclaimer: 'Ce rapport est une estimation basée sur vos factures payées. Vérifiez toujours sur autoentrepreneur.urssaf.fr.',
        paidInvoicesDisclaimer: `Seules les factures payées entre le ${startDate.toLocaleDateString('fr-FR')} et le ${endDate.toLocaleDateString('fr-FR')} sont incluses.`,
      };

      // Create the report
      await prisma.urssafReport.create({
        data: {
          userId: user.id,
          reportData: reportData,
          periodStartDate: startDate,
          periodEndDate: endDate,
          isAutomatic: true,
        },
      });

      // Create in-app notification for new report
      await createNotification(
        user.id,
        'URSSAF_REMINDER',
        `Nouveau rapport URSSAF ${declarationType}`,
        `Votre rapport URSSAF pour la période ${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')} est disponible. CA: ${caTotal.toFixed(2)}€, Cotisations: ${cotisations.toFixed(2)}€`,
        '/dashboard/reports',
        {
          reportPeriod: `${startDate.toISOString()}_${endDate.toISOString()}`,
          caTotal,
          cotisations,
          declarationType,
        }
      );

      // Create TVA threshold notifications if needed
      if (tvaApplicable && !user.tvaNumber) {
        await createNotification(
          user.id,
          'TVA_THRESHOLD_EXCEEDED',
          '🚨 Seuil TVA dépassé !',
          `Votre CA annuel a dépassé ${tvaThreshold}€. Vous devez vous enregistrer à la TVA et mettre à jour votre profil.`,
          '/dashboard/profile',
          { threshold: tvaThreshold, currentCA: caTotal }
        );
      } else if (caTotal >= tvaThreshold * 0.8 && !user.tvaNumber) {
        await createNotification(
          user.id,
          'TVA_THRESHOLD_WARNING', 
          '⚠️ Seuil TVA proche',
          `Attention: vous approchez du seuil TVA (${((caTotal / tvaThreshold) * 100).toFixed(1)}% atteint). Préparez-vous à devenir redevable de la TVA.`,
          '/dashboard/reports',
          { threshold: tvaThreshold, currentCA: caTotal, percentage: (caTotal / tvaThreshold) * 100 }
        );
      }

      console.log(`✅ Generated URSSAF report for user ${user.name} (${user.email}): ${caTotal.toFixed(2)}€ CA`);
    }

    return NextResponse.json({ 
      message: 'URSSAF reports generated successfully',
      processedUsers: users.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating URSSAF reports:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}