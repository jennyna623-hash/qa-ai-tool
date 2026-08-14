import assert from "node:assert/strict";
import test from "node:test";

await import("../public/report-export.js");

function unzipStoredFiles(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const files = new Map();
  let offset = 0;
  while (offset + 4 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
    files.set(name, decoder.decode(bytes.slice(dataStart, dataStart + compressedSize)));
    offset = dataStart + compressedSize;
  }
  return files;
}

test("creates a two-sheet Excel test report", () => {
  const bytes = globalThis.ProgressReportExport.createWorkbook({
    title: "每週測試報告",
    period: "2026-08-10－2026-08-14",
    generatedAt: "2026/8/14 下午 4:00:00",
    filterLabel: "環境：STG｜QA：Jenny",
    conclusion: "附條件上線",
    risk: "GSI-123 尚待修正",
    notes: "已完成主要流程驗證",
    metrics: { total: 1, completed: 0, testing: 1, pendingFix: 0, waitingDeploy: 0, defects: 1, regressionReady: 1, completionRate: 0 },
    environments: [{ label: "STG", count: 1 }],
    groups: [{ label: "STG 測試中", count: 1 }],
    items: [{
      key: "GSI-123", summary: "測試需求", url: "https://gamingsoft.atlassian.net/browse/GSI-123",
      status: "STG測試中", group: "STG 測試中", qaTesters: "Jenny", environment: "STG",
      submittedDate: "2026-08-10", devCompletedDate: "2026-08-11", stgCompletedDate: "—",
      prodCompletedDate: "—", releaseDate: "—", defectCount: 1, regressionReadyCount: 1,
      defects: "GSI-124｜STG待測試", note: "等待回歸"
    }]
  });

  assert.ok(bytes instanceof Uint8Array);
  assert.equal(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true), 0x04034b50);
  const files = unzipStoredFiles(bytes);
  assert.deepEqual([...files.keys()], [
    "[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels",
    "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"
  ]);
  assert.match(files.get("xl/workbook.xml"), /name="測試摘要"/);
  assert.match(files.get("xl/workbook.xml"), /name="進度明細"/);
  assert.match(files.get("xl/worksheets/sheet1.xml"), /每週測試報告/);
  assert.match(files.get("xl/worksheets/sheet1.xml"), /附條件上線/);
  assert.match(files.get("xl/worksheets/sheet2.xml"), /GSI-123/);
  assert.match(files.get("xl/worksheets/sheet2.xml"), /等待回歸/);
});
