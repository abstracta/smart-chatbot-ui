export function downloadFile(blob: Blob, name: string): void {
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", name);
    document.body.appendChild(link);

    link.click();
    link.remove();
    URL.revokeObjectURL(encodedUri);
}
