import { NextRequest, NextResponse } from "next/server";
import { extractDataFromPdf } from "./lib";

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const formData = await req.formData();

        const file = formData.get("file");
        if (!file) {
            return NextResponse.json(
                { error: "No files received." },
                { status: 400 }
            );
        }
        // @ts-ignore
        const buffer = Buffer.from(await file.arrayBuffer());
        const excelData = await extractDataFromPdf(buffer);

        return NextResponse.json({ message: "success", data: excelData });
    } catch (error) {
        return NextResponse.json({ error });
    }
}
