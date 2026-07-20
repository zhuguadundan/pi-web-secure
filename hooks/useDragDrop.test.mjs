import assert from "node:assert/strict";
import test from "node:test";

async function loadSubject() {
  return import("./useDragDrop.ts");
}

function file(name, type) {
  return { name, type, size: 1 };
}

test("splits images from files that should be uploaded", async () => {
  const { splitDroppedFiles } = await loadSubject();
  const image = file("photo.png", "image/png");
  const word = file("report.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  const excel = file("budget.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  assert.deepEqual(splitDroppedFiles([image, word, excel]), {
    images: [image],
    documents: [word, excel],
  });
});

test("treats unknown and empty MIME types as uploadable files", async () => {
  const { splitDroppedFiles } = await loadSubject();
  const unknown = file("archive.custom", "");

  assert.deepEqual(splitDroppedFiles([unknown]), {
    images: [],
    documents: [unknown],
  });
});
