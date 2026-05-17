export const extractPdfText =
  async (file: File) => {

    const pdfjsLib =
      await import("pdfjs-dist");

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "/pdf.worker.min.mjs";

    const arrayBuffer =
      await file.arrayBuffer();

    const pdf =
      await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

    let fullText = "";

    for (
      let pageNum = 1;
      pageNum <= pdf.numPages;
      pageNum++
    ) {

      const page =
        await pdf.getPage(pageNum);

      const textContent =
        await page.getTextContent();

      const textItems =
        textContent.items
          .map((item: any) => item.str)
          .join(" ");

      fullText +=
        `\n\n${textItems}`;
    }

    return fullText;
  };