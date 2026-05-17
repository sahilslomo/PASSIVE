import localforage from "localforage";

export type LocalStudyFile = {
  id: string;

  topicId: string;

  name: string;

  type: string;

  extractedText: string;

  uploadedAt: number;
};

/* =========================
   STORAGE INSTANCE
========================= */

const studyFilesStore =
  localforage.createInstance({
    name: "navik-study-files",
  });

/* =========================
   SAVE FILE
========================= */

export const saveStudyFile =
  async (
    file: LocalStudyFile
  ) => {

    await studyFilesStore.setItem(
      file.id,
      file
    );
  };

/* =========================
   GET FILES BY TOPIC
========================= */

export const getStudyFilesByTopic =
  async (topicId: string) => {

    const files:
      LocalStudyFile[] = [];

    await studyFilesStore.iterate(
      (value: any) => {

        if (
          value.topicId === topicId
        ) {
          files.push(value);
        }
      }
    );

    return files.sort(
      (a, b) =>
        b.uploadedAt -
        a.uploadedAt
    );
  };

/* =========================
   DELETE FILE
========================= */

export const deleteStudyFile =
  async (id: string) => {

    await studyFilesStore.removeItem(
      id
    );
  };