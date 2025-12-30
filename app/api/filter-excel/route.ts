import { NextRequest, NextResponse } from "next/server";
import ExcelJs from "exceljs";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fields = JSON.parse(formData.get('fields') as string);    // this will return eg [name, amount]

    if (!file || !fields?.length) {
        return NextResponse.json({ error: "Missing file or fields" }, { status: 400 });
    }

    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
        return NextResponse.json({ error: "Missing file or fields" }, { status: 400 });
    }

    const newWorkbook = new ExcelJs.Workbook();
    const newWorksheet = newWorkbook.addWorksheet('Filtered Data');

    // Identifying column indecies for selected fields
    const headerRow = worksheet?.getRow(1)
    // if no header row
    if(!headerRow) {
        return NextResponse.json({ error: "Missing file or fields" }, { status: 400 });
    }

    const targetMap: {name: string, index: number}[] = []
    headerRow.eachCell((cell, colNumber) => {
        if(fields.includes(cell.text)) {
            targetMap.push({ name: cell.text, index: colNumber })
        }
    })

    //Reconstructing the rows with only the target columns
    worksheet.eachRow((row) => {
        const filteredValues = targetMap.map(target => row.getCell(target.index).value);
        newWorksheet.addRow(filteredValues)
    })

    const buffer = await newWorkbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="filtered_${file.name}"`,
            'Content-Type': `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        },
    });
}