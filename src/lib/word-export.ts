import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
  PageBreak,
} from 'docx';
import { KpiSubmission, SchoolSettings } from './types';

/**
 * Sinh buffer file Microsoft Word (.docx) phiếu đánh giá KPI chuẩn khổ A4
 */
export async function generateTeacherKpiWordBuffer(
  submissions: KpiSubmission[],
  schoolSettings: SchoolSettings
): Promise<Buffer> {
  const sectionsChildren: any[] = [];

  submissions.forEach((sub, subIndex) => {
    if (subIndex > 0) {
      sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // 1. HEADER 2 CỘT: CƠ QUAN CHỦ QUẢN & QUỐC HIỆU TIÊU NGỮ
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO', size: 20 }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: (schoolSettings.schoolName || 'TRƯỜNG THPT CHUYÊN').toUpperCase(),
                      bold: true,
                      size: 21,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '----------------------', size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                      bold: true,
                      size: 21,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Độc lập - Tự do - Hạnh phúc',
                      bold: true,
                      size: 21,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '----------------------', size: 18 })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    sectionsChildren.push(headerTable);

    // 2. TIÊU ĐỀ BÁO CÁO
    sectionsChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'PHIẾU ĐÁNH GIÁ VÀ XẾP LOẠI KPI GIÁO VIÊN',
            bold: true,
            size: 28,
            color: '1E3A8A',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `Kỳ đánh giá: ${sub.periodName || `Tháng ${sub.month}/${sub.academicYear}`} | Năm học: ${sub.academicYear}`,
            italics: true,
            size: 21,
          }),
        ],
      })
    );

    // 3. THÔNG TIN GIÁO VIÊN
    sectionsChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: '1. Họ và tên: ', bold: true, size: 22 }),
          new TextRun({ text: sub.teacherName, bold: true, size: 22, color: '0F172A' }),
          new TextRun({ text: '        Email: ', bold: true, size: 22 }),
          new TextRun({ text: sub.teacherEmail, size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: '2. Đơn vị công tác: ', bold: true, size: 22 }),
          new TextRun({ text: sub.departmentName || 'Tổ chuyên môn', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: '3. Nhiệm vụ kiêm nhiệm: ', bold: true, size: 22 }),
          new TextRun({
            text: (sub.concurrentRoles && sub.concurrentRoles.length > 0)
              ? sub.concurrentRoles.join(', ')
              : 'Không có',
            italics: true,
            size: 22,
          }),
        ],
      })
    );

    // 4. BẢNG TIÊU CHÍ ĐÁNH GIÁ CHI TIẾT
    const tableHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, size: 19 })] })],
        }),
        new TableCell({
          width: { size: 44, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Nội dung tiêu chí đánh giá', bold: true, size: 19 })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Điểm chuẩn', bold: true, size: 19 })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hệ số', bold: true, size: 19 })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'GV Tự chấm', bold: true, size: 19 })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tổ Trưởng (B1)', bold: true, size: 19 })] })],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BGH Chốt (B2)', bold: true, size: 19 })] })],
        }),
      ],
    });

    const rows: TableRow[] = [tableHeaderRow];

    // MỤC I HEADER
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            shading: { fill: 'DBEAFE' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'I. MỤC I: ĐẠO ĐỨC, KỶ LUẬT & NỀN NẾP (TỐI ĐA 30 ĐIỂM)',
                    bold: true,
                    size: 20,
                    color: '1E40AF',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    const s1Items = (sub.items || []).filter((i) => i.section === 'SECTION_I');
    s1Items.forEach((item, idx) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, size: 19 })] })],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: item.taskName, bold: true, size: 19 })] }),
                ...(item.description ? [new Paragraph({ children: [new TextRun({ text: item.description, italics: true, size: 17, color: '64748B' })] })] : []),
              ],
            }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.standardScore}`, size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.difficultyCoefficient}x`, size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.selfScore}`, bold: true, size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.toTruongScore !== undefined ? `${item.toTruongScore}` : '—', size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.bghScore !== undefined ? `${item.bghScore}` : '—', bold: true, size: 19 })] })] }),
          ],
        })
      );
    });

    // MỤC II HEADER
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            shading: { fill: 'EDE9FE' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'II. MỤC II: CHUYÊN MÔN, KIÊM NHIỆM & DỰ ÁN (TỐI ĐA 70 ĐIỂM QUY ĐỔI)',
                    bold: true,
                    size: 20,
                    color: '5B21B6',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    const s2Items = (sub.items || []).filter((i) => i.section === 'SECTION_II');
    s2Items.forEach((item, idx) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, size: 19 })] })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: item.taskName, bold: true, size: 19 }),
                    new TextRun({ text: ` [Tiến độ: ${item.progressPercent}% - Chất lượng: ${item.qualityPercent}%]`, size: 17, color: '4338CA' }),
                  ],
                }),
                ...(item.description ? [new Paragraph({ children: [new TextRun({ text: item.description, italics: true, size: 17, color: '64748B' })] })] : []),
              ],
            }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.standardScore}`, size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.difficultyCoefficient}x`, size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.selfScore}`, bold: true, size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.toTruongScore !== undefined ? `${item.toTruongScore}` : '—', size: 19 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.bghScore !== undefined ? `${item.bghScore}` : '—', bold: true, size: 19 })] })] }),
          ],
        })
      );
    });

    // DÒNG TỔNG KẾT
    const finalScore = sub.bghFinalScore ?? (sub.toTruongTotalScore ?? sub.selfTotalScore);
    const gradeLabel = sub.finalGrade === 'XUAT_SAC' ? 'Xuất sắc' :
                       sub.finalGrade === 'TOT' ? 'Tốt' :
                       sub.finalGrade === 'HOAN_THANH' ? 'Hoàn thành' : 'Chưa hoàn thành';

    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            shading: { fill: 'FEF3C7' },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `TỔNG ĐIỂM KPI (Mục I: ${sub.bghScoreSection1 ?? sub.selfScoreSection1}đ + Mục II: ${sub.bghScoreSection2 ?? sub.selfScoreSection2}đ + Thưởng: +${sub.bghBonusScore ?? sub.selfBonusScore}đ): `,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${sub.selfTotalScore}đ`, bold: true, size: 20 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sub.toTruongTotalScore ? `${sub.toTruongTotalScore}đ` : '—', bold: true, size: 20 })] })],
          }),
          new TableCell({
            shading: { fill: 'D1FAE5' },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${finalScore}đ`, bold: true, size: 21, color: '065F46' })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            shading: { fill: 'ECFDF5' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'KẾT LUẬN XẾP LOẠI KPI THÁNG: ', bold: true, size: 22, color: '065F46' }),
                  new TextRun({ text: gradeLabel.toUpperCase(), bold: true, size: 24, color: '047857' }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    const kpiTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    });

    sectionsChildren.push(kpiTable);

    // 5. Ý KIẾN NHẬN XÉT CỦA TỔ TRƯỞNG & BGH
    sectionsChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: '4. Nhận xét của Tổ trưởng chuyên môn: ', bold: true, size: 21 }),
          new TextRun({ text: sub.toTruongNote || 'Nhất trí với kết quả tự đánh giá của giáo viên.', italics: true, size: 21 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({ text: '5. Nhận xét và phê duyệt của Ban Giám Hiệu: ', bold: true, size: 21 }),
          new TextRun({ text: sub.bghNote || 'Phê duyệt kết quả đánh giá KPI của giáo viên.', italics: true, size: 21 }),
        ],
      })
    );

    // 6. KHỐI CHỮ KÝ 3 BÊN (DÀN KHỔ A4 CHUẨN)
    const signatureTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'NGƯỜI TỰ ĐÁNH GIÁ', bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', italics: true, size: 18 })],
                }),
                new Paragraph({ text: '', spacing: { before: 800 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: sub.teacherName, bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'TỔ TRƯỞNG CHUYÊN MÔN', bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', italics: true, size: 18 })],
                }),
                new Paragraph({ text: '', spacing: { before: 800 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '............................................', size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'HIỆU TRƯỞNG / BGH PHÊ DUYỆT', bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '(Ký, đóng dấu và ghi rõ họ tên)', italics: true, size: 18 })],
                }),
                new Paragraph({ text: '', spacing: { before: 800 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '............................................', size: 18 })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    sectionsChildren.push(signatureTable);
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1100,
              right: 1100,
            },
          },
        },
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
