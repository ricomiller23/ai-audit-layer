export const downloadMockFile = (filename: string, content: string, type: 'csv' | 'pdf' | 'json' | 'yaml') => {
    const mimeTypes = {
        csv: 'text/csv',
        pdf: 'application/pdf',
        json: 'application/json',
        yaml: 'text/yaml'
    };

    const blob = new Blob([content], { type: mimeTypes[type] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

export const generateMockPDFContent = () => {
    // A simple PDF header/content mock - obviously not a real binary PDF, 
    // but enough to be a "file" the browser downloads. 
    // For a real app we'd use jspdf, but for this generic "make it work" request, 
    // a text file named .pdf is often enough, OR we can just make it a text file if we want to be safe.
    // Let's stick to text content but with the correct extension so the browser treats it as a download.
    return `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (AI Audit Layer Report) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000231 00000 n
0000000302 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
396
%%EOF
`;
};
