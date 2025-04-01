import { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  linkHref: string;
  linkText: string;
  colorClass: string;
}

const StatCard = ({
  title,
  value,
  icon,
  linkHref,
  linkText,
  colorClass,
}: StatCardProps) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", colorClass)}>
            {icon}
          </div>
          <div className="mr-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link 
            href={linkHref} 
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
