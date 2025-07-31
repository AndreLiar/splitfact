import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import csv from 'csv-parser';
import { Readable } from 'stream';
import cloudinary from '@/lib/cloudinary';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collectiveId: string  }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId  } = await params; // collectiveId is still in params but will not be used for client association

  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: `user_clients/${session.user.id}` }, // Store under user's ID
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return new NextResponse("Failed to upload file to Cloudinary", { status: 500 });
    }

    const readableStream = Readable.from(buffer.toString());

    const clientsToCreate: any[] = [];
    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csv())
        .on('data', (row) => {
          const { 
            "Nom ou Raison sociale": name,
            "Adresse": address,
            "SIRET": siret,
            "TVA intracom": tvaNumber,
            "Forme juridique": legalStatus,
            "Capital social": shareCapital,
            "Contact": contactName,
            "Email": email,
            "Téléphone": phone // Assuming 'Téléphone' might be a column for phone
          } = row;

          if (!name) {
            errors.push(`Row skipped: Name is required. Row data: ${JSON.stringify(row)}`);
            skippedCount++;
            return;
          }

          clientsToCreate.push({
            name: String(name),
            email: email ? String(email) : null,
            siret: siret ? String(siret) : null,
            address: address ? String(address) : null,
            tvaNumber: tvaNumber ? String(tvaNumber) : null,
            legalStatus: legalStatus ? String(legalStatus) : null,
            shareCapital: shareCapital ? String(shareCapital) : null,
            contactName: contactName ? String(contactName) : null,
            phone: phone ? String(phone) : null,
            userId: session.user.id, // Associate client with the current user
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    for (const clientData of clientsToCreate) {
      try {
        // Check for existing client by name and userId to avoid duplicates
        const existingClient = await prisma.client.findFirst({
          where: {
            name: clientData.name,
            userId: session.user.id,
          },
        });

        if (existingClient) {
          errors.push(`Client skipped: Client with name '${clientData.name}' already exists for this user. Data: ${JSON.stringify(clientData)}`);
          skippedCount++;
          continue;
        }

        await prisma.client.create({ data: clientData });
        importedCount++;
      } catch (clientError: any) {
        errors.push(`Failed to import client '${clientData.name}': ${clientError.message}. Data: ${JSON.stringify(clientData)}`);
        skippedCount++;
      }
    }

    return NextResponse.json({ importedCount, skippedCount, errors }, { status: 200 });
  } catch (error) {
    console.error("Error importing clients:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
