"use client";

import { useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";

export default function Home() {
    const [file, setFile] = useState(null);
    const [excelData, setExcelData] = useState<any[]>();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: any) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsUploading(true);
            const response = await axios.post("/api/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("File uploaded successfully:", response.data);
            setExcelData(response.data.data);
            alert("PDF file converted to xlsx successfully. Download now!");
        } catch (error) {
            console.error("Error uploading file:", error);
        } finally {
            setIsUploading(false);
        }
    };

    function handleFileDownload() {
        if (!file) {
            return;
        }
        // Create a workbook and add a worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        // Add data to the worksheet
        worksheet.addRows(excelData || []);

        // Generate a Blob object containing the Excel file
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);

            // Create a link element to trigger the download
            const a = document.createElement("a");
            a.href = url;
            a.download = "example.xlsx";
            document.body.appendChild(a);
            a.click();

            // Cleanup
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    }

    return (
        <div className="flex justify-center items-center h-96 flex-col">
            <h1 className="text-3xl font-bold">Upload a PDF File</h1>
            <form onSubmit={handleSubmit} className="flex flex-col my-10 gap-5">
                <input type="file" onChange={handleFileChange} />
                <button
                    type="submit"
                    disabled={isUploading}
                    className="bg-black text-white px-3 py-1 rounded-md disabled:bg-black/50"
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </button>
                <button
                    type="button"
                    className="bg-black text-white px-3 py-1 rounded-md"
                    onClick={handleFileDownload}
                >
                    Download
                </button>
            </form>
        </div>
    );
}
