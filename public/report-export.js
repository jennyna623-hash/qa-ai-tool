(function attachProgressReportExport(root) {
  const encoder = new TextEncoder();

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function columnName(index) {
    let value = index + 1;
    let result = "";
    while (value > 0) {
      value -= 1;
      result = String.fromCharCode(65 + (value % 26)) + result;
      value = Math.floor(value / 26);
    }
    return result;
  }

  function rowXml(values, rowIndex, styleId = 4) {
    const cells = values.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex}`;
      if (typeof value === "number" && Number.isFinite(value)) return `<c r="${reference}" s="${styleId}"><v>${value}</v></c>`;
      return `<c r="${reference}" s="${styleId}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex}">${cells}</row>`;
  }

  function worksheetXml(rows, widths, options = {}) {
    const rowCount = Math.max(rows.length, 1);
    const columnCount = Math.max(...rows.map((row) => row.values.length), 1);
    const lastCell = `${columnName(columnCount - 1)}${rowCount}`;
    const columns = widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("");
    const sheetRows = rows.map((row, index) => rowXml(row.values, index + 1, row.style ?? 4)).join("");
    const mergeCells = (options.merges || []).length
      ? `<mergeCells count="${options.merges.length}">${options.merges.map((reference) => `<mergeCell ref="${reference}"/>`).join("")}</mergeCells>`
      : "";
    const frozenPane = options.freezeRow
      ? `<pane ySplit="${options.freezeRow}" topLeftCell="A${options.freezeRow + 1}" activePane="bottomLeft" state="frozen"/>`
      : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <sheetViews><sheetView workbookViewId="0">${frozenPane}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columns}</cols>
  <sheetData>${sheetRows}</sheetData>
  ${mergeCells}
  <autoFilter ref="${options.autoFilter || `A1:${lastCell}`}"/>
</worksheet>`;
  }

  function workbookFiles(report) {
    const summaryRows = [
      { values: [report.title], style: 1 },
      { values: ["報告期間", report.period], style: 4 },
      { values: ["產生時間", report.generatedAt], style: 4 },
      { values: ["資料範圍", report.filterLabel], style: 5 },
      { values: ["測試結論", report.conclusion], style: 5 },
      { values: ["風險與阻塞", report.risk || "無"], style: 5 },
      { values: ["備註", report.notes || "無"], style: 5 },
      { values: [""], style: 4 },
      { values: ["測試摘要"], style: 2 },
      { values: ["項目", "數量"], style: 3 },
      { values: ["追蹤需求", report.metrics.total], style: 4 },
      { values: ["已完成", report.metrics.completed], style: 4 },
      { values: ["測試中／待測試", report.metrics.testing], style: 4 },
      { values: ["待修正", report.metrics.pendingFix], style: 4 },
      { values: ["待進版", report.metrics.waitingDeploy], style: 4 },
      { values: ["關聯 BUG", report.metrics.defects], style: 4 },
      { values: ["可回歸 BUG", report.metrics.regressionReady], style: 4 },
      { values: ["完成率", `${report.metrics.completionRate}%`], style: 4 },
      { values: [""], style: 4 },
      { values: ["環境分布"], style: 2 },
      { values: ["環境", "數量"], style: 3 },
      ...report.environments.map((entry) => ({ values: [entry.label, entry.count], style: 4 })),
      { values: [""], style: 4 },
      { values: ["進度分類"], style: 2 },
      { values: ["分類", "數量"], style: 3 },
      ...report.groups.map((entry) => ({ values: [entry.label, entry.count], style: 4 }))
    ];

    const detailHeader = [
      "需求單", "標題", "Jira 連結", "狀態", "自動分類", "QA測試人員", "提測環境", "提測日",
      "DEV完成日", "STG完成日", "PROD完成日", "上線日", "關聯BUG數", "可回歸BUG數", "關聯BUG", "備註"
    ];
    const detailRows = [
      { values: detailHeader, style: 3 },
      ...report.items.map((item) => ({
        values: [
          item.key, item.summary, item.url, item.status, item.group, item.qaTesters, item.environment,
          item.submittedDate, item.devCompletedDate, item.stgCompletedDate, item.prodCompletedDate,
          item.releaseDate, item.defectCount, item.regressionReadyCount, item.defects, item.note
        ],
        style: 5
      }))
    ];

    const summarySheet = worksheetXml(summaryRows, [24, 92], { merges: ["A1:B1"], autoFilter: "A10:B18" });
    const detailSheet = worksheetXml(detailRows, [15, 46, 44, 18, 18, 22, 14, 14, 14, 14, 14, 14, 14, 16, 45, 42], {
      freezeRow: 1,
      autoFilter: `A1:P${Math.max(detailRows.length, 1)}`
    });

    return [
      { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>` },
      { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>` },
      { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="測試摘要" sheetId="1" r:id="rId1"/><sheet name="進度明細" sheetId="2" r:id="rId2"/></sheets>
</workbook>` },
      { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>` },
      { name: "xl/styles.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Microsoft JhengHei"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Microsoft JhengHei"/></font>
    <font><b/><color rgb="FF172033"/><sz val="15"/><name val="Microsoft JhengHei"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEAF1FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFE3E8F0"/></left><right style="thin"><color rgb="FFE3E8F0"/></right><top style="thin"><color rgb="FFE3E8F0"/></top><bottom style="thin"><color rgb="FFE3E8F0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>` },
      { name: "xl/worksheets/sheet1.xml", content: summarySheet },
      { name: "xl/worksheets/sheet2.xml", content: detailSheet }
    ];
  }

  let crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = Array.from({ length: 256 }, (_, index) => {
        let value = index;
        for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
        return value >>> 0;
      });
    }
    let crc = 0xffffffff;
    bytes.forEach((byte) => { crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); });
    return (crc ^ 0xffffffff) >>> 0;
  }

  function littleEndian16(value) {
    return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
  }

  function littleEndian32(value) {
    return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
  }

  function concatBytes(chunks) {
    const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    let offset = 0;
    chunks.forEach((chunk) => {
      output.set(chunk, offset);
      offset += chunk.length;
    });
    return output;
  }

  function dosTimestamp(date = new Date()) {
    const year = Math.max(date.getFullYear(), 1980);
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function zipFiles(files) {
    const localChunks = [];
    const centralChunks = [];
    let localOffset = 0;
    const timestamp = dosTimestamp();

    files.forEach((file) => {
      const name = encoder.encode(file.name);
      const data = encoder.encode(file.content);
      const checksum = crc32(data);
      const localHeader = concatBytes([
        littleEndian32(0x04034b50), littleEndian16(20), littleEndian16(0x0800), littleEndian16(0),
        littleEndian16(timestamp.time), littleEndian16(timestamp.date), littleEndian32(checksum),
        littleEndian32(data.length), littleEndian32(data.length), littleEndian16(name.length), littleEndian16(0), name
      ]);
      localChunks.push(localHeader, data);

      const centralHeader = concatBytes([
        littleEndian32(0x02014b50), littleEndian16(20), littleEndian16(20), littleEndian16(0x0800), littleEndian16(0),
        littleEndian16(timestamp.time), littleEndian16(timestamp.date), littleEndian32(checksum),
        littleEndian32(data.length), littleEndian32(data.length), littleEndian16(name.length), littleEndian16(0),
        littleEndian16(0), littleEndian16(0), littleEndian16(0), littleEndian32(0), littleEndian32(localOffset), name
      ]);
      centralChunks.push(centralHeader);
      localOffset += localHeader.length + data.length;
    });

    const locals = concatBytes(localChunks);
    const central = concatBytes(centralChunks);
    const end = concatBytes([
      littleEndian32(0x06054b50), littleEndian16(0), littleEndian16(0), littleEndian16(files.length),
      littleEndian16(files.length), littleEndian32(central.length), littleEndian32(locals.length), littleEndian16(0)
    ]);
    return concatBytes([locals, central, end]);
  }

  function createWorkbook(report) {
    return zipFiles(workbookFiles(report));
  }

  root.ProgressReportExport = { createWorkbook, xmlEscape };
})(typeof window !== "undefined" ? window : globalThis);
