"use client"

import { useState } from "react"
import * as XLSX from "xlsx"

export default function ExcelFilter() {
    const [file, setFile] = useState<File | null>(null)
    const [headers, setHeaders] = useState<string[]>([])
    const [selectedFields, setSelectedFields] = useState<string[]>([])
    const [isDownloading, setIsDownloading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setError(null);
        setSelectedFields([]);
        setHeaders([])

        // reading headers
        try {
            const data = await uploadedFile.arrayBuffer();
            const workbook = XLSX.read(data, {sheetRows: 1})
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    
            setHeaders(json[0] as string[]);
        } catch (e) {
            console.error(e)
            setError("Could not read the file. Is it a valid xlsx file?")
        }
    };

    const toggleFields = (field: string) => {
        setSelectedFields((prev) => prev.includes(field) ? prev.filter(f => f!== field) : [...prev, field])
    }

    const downloadFilteredSheet = async() => {
        if(!file) return;
        setIsDownloading(true);
        setError(null)

        try{
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fields', JSON.stringify(selectedFields));
    
            const response = await fetch("/api/filter-excel", {method: 'POST', body: formData});
            if(!response.ok) throw new Error("Server Responded with error");
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a');
            a.href = url
            a.download = `filtered_${file.name}`
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e)
            setError("Something went wrong while generating the filtered file.")
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="flex p-4 min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-800 shadow-lg p-8 space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center">Excel Columns Filter</h2>

                <div className="flex justify-center">
                    <input id="file-input" type="file" accept=".xlsx" className="sr-only" onChange={handleFileUpload} />

                    <label htmlFor="file-input" className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 focus-visible:outline focus-visible:oultine-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            {file ? file.name : "Upload Excel (.xlsx)"}
                        </svg>
                    </label>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                {headers.length > 0 && (
                    <section aria-labelledby="choose-columns">
                        <h3 id="choose-columns" className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">
                            Choose Columns to keep
                        </h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 p-2">
                            {headers.map((h, i) => (
                                <label key={i} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedFields.includes(h)} onChange={() => toggleFields(h)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                        {h}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {selectedFields.length === 0 && (
                            <p className="mt-2 text-sm text-gray-500">No columns selected yet - pick at least one column</p>
                        )}
                    </section>
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={downloadFilteredSheet}
                        disabled={selectedFields.length === 0 || isDownloading}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        selectedFields.length === 0 || isDownloading
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-primary-600 hover:bg-primary-700 text-white"
                        } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600`}
                    >
                        {isDownloading ? (
                        <>
                            <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                            </svg>
                            Generating…
                        </>
                        ) : (
                        <>
                            <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                            </svg>
                            Download filtered Excel
                        </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}