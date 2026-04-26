import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Définir le dossier de destination
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {}

    // Générer un nom de fichier unique
    const ext = path.extname(file.name);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Écrire le fichier
    await writeFile(filePath, buffer);

    // Retourner l'URL publique
    const url = `/uploads/${fileName}`;
    
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
