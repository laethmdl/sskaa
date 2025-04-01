import { useLocale } from "@/hooks/use-locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeTableItemProps {
  id: number;
  name: string;
  position: string;
  imageUrl?: string;
  dueDate: string;
  status: string;
  statusColor: string;
  onView: (id: number) => void;
  onProcess: (id: number) => void;
}

interface EmployeeTableProps {
  title: string;
  items: EmployeeTableItemProps[];
  linkHref: string;
  linkText: string;
  itemType: "allowance" | "promotion";
}

const EmployeeTable = ({
  title,
  items,
  linkHref,
  linkText,
  itemType,
}: EmployeeTableProps) => {
  const { formatDate } = useLocale();
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الموظف</TableHead>
              <TableHead>تاريخ الاستحقاق</TableHead>
              <TableHead>
                {itemType === "allowance" ? "نوع العلاوة" : "الدرجة الحالية"}
              </TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.position}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {formatDate(new Date(item.dueDate))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`bg-${item.statusColor}-100 text-${item.statusColor}-800`}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary-600 hover:text-primary-900 ml-3"
                    onClick={() => item.onView(item.id)}
                  >
                    عرض
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary-600 hover:text-primary-900"
                    onClick={() => item.onProcess(item.id)}
                  >
                    معالجة
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
        <a
          href={linkHref}
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          {linkText} <span className="mr-1">&#8592;</span>
        </a>
      </div>
    </div>
  );
};

export default EmployeeTable;
