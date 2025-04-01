import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// تعريف نوع الأعمدة
interface Column {
  header: string;
  accessor: string;
}

interface ExportDataProps {
  data: any[];
  columns: Column[];
  fileName?: string;
  title?: string;
}

// إضافة الدعم للغة العربية في PDF
const addArabicFont = (doc: jsPDF) => {
  try {
    // استخدام خط مدعوم للغة العربية
    doc.setFont("Courier", "normal"); // استخدام خط Courier لأنه يعمل بشكل أفضل مع العربية
    doc.setR2L(true); // تفعيل اتجاه النص من اليمين لليسار
    doc.setLanguage("ar-SA"); // تعيين اللغة إلى العربية إذا كان متاحاً
  } catch (error) {
    console.error("خطأ في تعيين خط عربي:", error);
    // في حالة الفشل، نستخدم الافتراضي
    doc.setFont("Helvetica", "normal");
    doc.setR2L(true);
  }
};

export const ExportData: React.FC<ExportDataProps> = ({ 
  data, 
  columns, 
  fileName = "exported-data",
  title = "البيانات المصدرة" 
}) => {
  
  // تصدير البيانات إلى ملف PDF
  const exportToPDF = () => {
    try {
      // إنشاء وثيقة PDF بالاتجاه الأفقي
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // إضافة دعم اللغة العربية
      addArabicFont(doc);
      
      // إضافة عنوان للوثيقة
      doc.text(title, doc.internal.pageSize.width / 2, 10, { align: 'center' });
      
      // تحضير البيانات للجدول
      const tableData = data.map(item => {
        return columns.map(column => item[column.accessor] || '');
      });
      
      // تحضير أعمدة الجدول
      const tableColumns = columns.map(column => ({
        header: column.header,
        dataKey: column.accessor
      }));
      
      // إضافة الجدول للوثيقة
      (doc as any).autoTable({
        head: [tableColumns.map(col => col.header)],
        body: tableData,
        startY: 20,
        theme: 'grid',
        styles: {
          font: 'Courier', // استخدام خط Courier الذي يدعم العربية بشكل أفضل
          halign: 'right',
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          direction: 'rtl', // تعيين اتجاه النص من اليمين إلى اليسار
          minCellWidth: 10, // زيادة عرض الخلايا للنص العربي
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        didDrawCell: (data: any) => {
          // تحسين عرض النص العربي عن طريق تعديل موضع النص داخل الخلايا
          if (data.section === 'body' || data.section === 'head') {
            const td = data.cell.raw;
            if (td && typeof td === 'string' && /[\u0600-\u06FF]/.test(td)) {
              // تعديل موضع النص للعربية إذا كان يحتوي على أحرف عربية
              data.cell.styles.halign = 'right';
            }
          }
        },
      });
      
      // حفظ الملف
      doc.save(`${fileName}.pdf`);
      
    } catch (error) {
      console.error("حدث خطأ أثناء تصدير البيانات إلى PDF:", error);
      alert("حدث خطأ أثناء تصدير البيانات إلى PDF");
    }
  };
  
  // تصدير البيانات إلى ملف Excel
  const exportToExcel = () => {
    try {
      // تحضير البيانات للإكسل
      const excelData = data.map(item => {
        const row: any = {};
        columns.forEach(column => {
          row[column.header] = item[column.accessor] || '';
        });
        return row;
      });
      
      // إنشاء ورقة عمل
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // تعديل اتجاه النص للعربية في إكسل
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cell_address]) continue;
          worksheet[cell_address].s = {
            alignment: { 
              horizontal: "right",
              vertical: "center",
              wrapText: true
            },
            font: {
              name: "Arial"
            }
          };
        }
      }
      
      // إنشاء مصنف عمل وإضافة ورقة العمل إليه
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");
      
      // حفظ المصنف كملف إكسل
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      
    } catch (error) {
      console.error("حدث خطأ أثناء تصدير البيانات إلى Excel:", error);
      alert("حدث خطأ أثناء تصدير البيانات إلى Excel");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 gap-1">
          <Download className="h-4 w-4" />
          <span>تصدير</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
          <FileText className="ml-2 h-4 w-4" />
          <span>تصدير كملف PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          <FileSpreadsheet className="ml-2 h-4 w-4" />
          <span>تصدير كملف Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportData;