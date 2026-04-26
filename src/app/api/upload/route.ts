import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

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
    const ext = path.extname(file.name).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    const fileName = `${uuidv4()}${isImage ? ".png" : ext}`; // On force le .png pour la compatibilité
    const filePath = path.join(uploadDir, fileName);

    if (isImage) {
      // Compression et conversion en PNG avec Sharp
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true }) // 800px est encore plus léger et suffit à l'IA
        .png({ quality: 70, compressionLevel: 9 }) // Qualité un peu réduite pour le poids
        .toBuffer();
      await writeFile(filePath, compressedBuffer);
    } else {
      await writeFile(filePath, buffer);
    }

    // Retourner l'URL publique
    const url = `/uploads/${fileName}`;
    
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
