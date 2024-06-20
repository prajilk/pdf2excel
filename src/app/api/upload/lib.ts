import pdf from "pdf-parse";
import ExcelJS from "exceljs";

const extractDataFromPdf = async (dataBuffer: any) => {
    const resultData = {
        store: "",
        poNo: "",
        poDate: "",
        items: [],
    };

    const data = await pdf(dataBuffer);
    const text = data.text;

    // Use regex to find the text between "GSTIN" and "BILLING ADDRESS:-"
    const gstinBillingAddressRegex = /GSTIN\s*(.*?)\s*BILLING ADDRESS:-/;
    const match = gstinBillingAddressRegex.exec(text);
    if (match) {
        const extractedText = match[1].trim();
        // console.log(`Store name: ${extractedText}`);
        resultData.store = extractedText;
    } else {
        console.log("Pattern not found");
    }

    // Use regex to find the "PO No"
    const poNoRegex = /PO No:(\d+)/;
    const poNoMatch = poNoRegex.exec(text);
    if (poNoMatch) {
        const poNo = poNoMatch[1].trim();
        // console.log(`PO No: ${poNo}`);
        resultData.poNo = poNo;
    } else {
        console.log("PO No pattern not found");
    }

    // Use regex to find the "PO No"
    const poDateRegex = /PO Date:(\d{2}\.\d{2}\.\d{4})/;
    const poDateMatch = poDateRegex.exec(text);
    if (poDateMatch) {
        const poDate = poDateMatch[1].trim();
        // console.log(`PO Date: ${poDate}`);
        resultData.poDate = poDate;
    } else {
        console.log("PO Date pattern not found");
    }

    const lines = text.split("\n");
    const results = [];
    let currentDescription = "";
    let capturingDescription = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Check if the line contains a row number and start capturing the description
        if (/^\d+\s+/.test(line)) {
            capturingDescription = true;
            const parts = line.split(/\s+/);
            const rowNumber = parts.shift();
            currentDescription = parts.join(" ");

            // If the line contains a quantity, extract it and reset capturingDescription
            const quantityMatch =
                currentDescription.match(/(\d+\.\d{3})\s+Nos/);
            if (quantityMatch) {
                const quantity = quantityMatch[1];
                currentDescription = currentDescription
                    .replace(/(\d+\.\d{3})\s+Nos.*/, "")
                    .trim();

                // Regular expression to match "Page 2 / 3" followed by any text (non-greedily)
                let regex = /Page 2 \/ 3\s*(.*)/s;

                // Test if the line matches the regex
                let match = regex.exec(text);

                if (match) {
                    // match[1] contains the text after "Page 2 / 3"
                    let textAfterPage = match.join("+").split("\n")[1];
                    currentDescription += textAfterPage;
                } else {
                    console.log("No match found.");
                }

                results.push({
                    rowNumber,
                    description: currentDescription,
                    quantity,
                });
                capturingDescription = false;
                currentDescription = "";
            }
        } else if (capturingDescription) {
            // Append to the description if currently capturing
            currentDescription += " " + line;

            // Check if this line contains the quantity, indicating the end of the description
            const quantityMatch =
                currentDescription.match(/(\d+\.\d{3})\s+Nos/);
            if (quantityMatch) {
                const quantity = quantityMatch[1];
                currentDescription = currentDescription
                    .replace(/(\d+\.\d{3})\s+Nos.*/, "")
                    .trim();
                results.push({
                    description: currentDescription,
                    quantity,
                });
                capturingDescription = false;
                currentDescription = "";
            }
        }
    }

    // Log the extracted data
    results.forEach((result) => {
        // @ts-ignore
        resultData.items.push({
            name: result.description,
            quantity: result.quantity,
        });
    });

    const excelData = [
        [
            "SL NO",
            "Store Name",
            "Po No",
            "PO Date",
            "Item name",
            "Po Qty",
            "Sent Qty",
            "Sent Date",
            "Pending Qty",
        ],
        ...resultData.items.map((item, i) => [
            i + 1,
            resultData.store,
            resultData.poNo,
            resultData.poDate,
            // @ts-ignore
            item.name,
            // @ts-ignore
            Number(item.quantity),
        ]),
    ];

    return excelData;

    // handleDownload(excelData);
};

const handleDownload = (excelData: any) => {
    // Create a workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add data to the worksheet
    worksheet.addRows(excelData);

    // Save the workbook
    const filename = "example.xlsx";
    workbook.xlsx.writeFile(filename).then(() => {
        console.log(`File "${filename}" created successfully.`);
    });
};

export { extractDataFromPdf };
