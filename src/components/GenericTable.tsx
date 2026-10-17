import React, { useMemo, useState } from "react";

import type { GenericTableProps } from "../models/Components/GenericTableProps.ts";

const GenericTable: React.FC<GenericTableProps> = ({
    data,
    columns,
    actions,
    onAction,
    renderCell,
    rowClassName
}) => {

    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 5;

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;

        return data.slice(start, end);
    }, [data, currentPage]);

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            {columns.map((col, index) => (
                                <th
                                    key={col.key}
                                    className={`py-4 px-4 font-medium text-black dark:text-white ${
                                        index === 0
                                            ? "min-w-[220px] xl:pl-11"
                                            : "min-w-[150px]"
                                    }`}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {actions.length > 0 && (
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((item, index) => (
                            <tr
                                key={index}
                                className={rowClassName?.(item)}
                            >
                                {columns.map((col, colIndex) => (
                                    <td
                                        key={col.key}
                                        className={`border-b border-[#eee] py-5 px-4 dark:border-strokedark ${
                                            colIndex === 0
                                                ? "pl-9 xl:pl-11"
                                                : ""
                                        }`}
                                    >
                                        {renderCell ? (
                                            renderCell(col.key, item)
                                        ) : (
                                            <p className="text-black dark:text-white">
                                                {
                                                    item[col.key] === true
                                                        ? "Activo"
                                                        : (
                                                            item[col.key] === false
                                                                ? "Inactivo"
                                                                : item[col.key]
                                                        )
                                                }
                                            </p>
                                        )}
                                    </td>
                                ))}
                                {actions.length > 0 && (
                                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                        <div className="flex items-center gap-2">
                                            {actions.map((action) => (
                                                <button
                                                    key={action.name}
                                                    onClick={() => onAction(action.name, item)}
                                                    type="button"
                                                    className={`rounded-md border border-stroke px-2 py-1 text-xs font-medium transition
                                                    hover:bg-gray-2 dark:border-strokedark
                                                    ${
                                                        action.name === "delete"
                                                            ? "text-red-500 hover:bg-red-100"
                                                            : ""
                                                    }
                                                    ${
                                                        action.name === "view"
                                                            ? "text-blue-500 hover:bg-blue-100"
                                                            : ""
                                                    }
                                                    ${
                                                        action.name === "download"
                                                            ? "text-green-500 hover:bg-green-100"
                                                            : ""
                                                    }
                                                `}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-between p-4">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <div className="flex items-center gap-2">
                            {
                                Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`rounded px-3 py-1 ${
                                            currentPage === page
                                                ? "bg-primary text-white"
                                                : "border"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))
                            }
                        </div>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )
            }
        </div>
    );
};

export default GenericTable;
