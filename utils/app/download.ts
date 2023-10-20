export function downloadFile(content: string, name: string): void {
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", name);
    document.body.appendChild(link);

    link.click();
    link.remove();
}