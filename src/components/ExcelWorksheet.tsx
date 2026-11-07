import React, { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Download,
  FileSpreadsheet,
  Columns3,
  Calculator,
  Check,
  Edit2,
  Cloud,
} from 'lucide-react';
import { Worksheet, ColumnDefinition, RowData } from '../types/family';

interface ExcelWorksheetProps {
  worksheet: Worksheet;
  onSave: (updated: Worksheet) => void;
  onDelete?: (sheetId: string) => void;
}

// Pure helper function outside component to maintain 100% stable reference
function calculateTotalSheetAmount(cols: ColumnDefinition[], currentRows: RowData[]): number {
  const numericCols = cols.filter(c => c.type === 'number');
  if (numericCols.length === 0) return 0;
  const sums = numericCols.map(col => {
    return currentRows.reduce((acc, row) => {
      const val = row.cells[col.id];
      const num = typeof val === 'number' ? val : parseFloat(String(val) || '0');
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  });
  return Math.max(...sums, 0);
}

export const ExcelWorksheet: React.FC<ExcelWorksheetProps> = ({
  worksheet,
  onSave,
  onDelete,
}) => {
  // State initialized per worksheet instance (governed by key={worksheet.id} in parent)
  const [sheetTitle, setSheetTitle] = useState(worksheet.title);
  const [columns, setColumns] = useState<ColumnDefinition[]>(worksheet.columns);
  const [rows, setRows] = useState<RowData[]>(worksheet.rows);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Immediate database commit
  const commitNow = useCallback(
    (
      currentTitle: string = sheetTitle,
      currentCols: ColumnDefinition[] = columns,
      currentRows: RowData[] = rows
    ) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      setSaveStatus('saving');
      const totalAmount = calculateTotalSheetAmount(currentCols, currentRows);
      const updated: Worksheet = {
        ...worksheet,
        title: currentTitle,
        columns: currentCols,
        rows: currentRows,
        totalAmount,
        updatedAt: new Date().toISOString(),
      };
      onSaveRef.current(updated);
      setSaveStatus('saved');
    },
    [columns, rows, sheetTitle, worksheet]
  );

  // Debounced auto-save on typing
  const scheduleAutoSave = (
    newTitle: string = sheetTitle,
    newCols: ColumnDefinition[] = columns,
    newRows: RowData[] = rows
  ) => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      commitNow(newTitle, newCols, newRows);
    }, 400);
  };

  // Cell change handler
  const handleCellChange = (rowId: string, colId: string, value: string) => {
    const colDef = columns.find(c => c.id === colId);
    const parsedVal =
      colDef?.type === 'number' && value !== '' && !isNaN(Number(value))
        ? Number(value)
        : value;

    const nextRows = rows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          cells: {
            ...r.cells,
            [colId]: parsedVal,
          },
        };
      }
      return r;
    });

    setRows(nextRows);
    scheduleAutoSave(sheetTitle, columns, nextRows);
  };

  // Add row
  const handleAddRow = () => {
    const newId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const emptyCells: Record<string, string | number> = {};
    columns.forEach(col => {
      emptyCells[col.id] = col.type === 'number' ? 0 : '';
    });
    const nextRows = [...rows, { id: newId, cells: emptyCells }];
    setRows(nextRows);
    commitNow(sheetTitle, columns, nextRows);
    showToast('Row added & saved');
  };

  // Delete row
  const handleDeleteRow = (rowId: string) => {
    const nextRows = rows.filter(r => r.id !== rowId);
    setRows(nextRows);
    commitNow(sheetTitle, columns, nextRows);
    showToast('Row deleted & saved');
  };

  // Add column
  const handleAddColumn = () => {
    const colIndex = columns.length + 1;
    const colLetter = String.fromCharCode(64 + colIndex);
    const newColId = `col_${Date.now()}`;
    const newCol: ColumnDefinition = {
      id: newColId,
      label: `Column ${colLetter}`,
      type: 'text',
      width: 140,
    };
    const nextCols = [...columns, newCol];
    const nextRows = rows.map(r => ({
      ...r,
      cells: {
        ...r.cells,
        [newColId]: '',
      },
    }));

    setColumns(nextCols);
    setRows(nextRows);
    commitNow(sheetTitle, nextCols, nextRows);
    showToast('Column added & saved');
  };

  // Delete column
  const handleDeleteColumn = (colId: string) => {
    if (columns.length <= 1) {
      alert('Worksheet must have at least one column.');
      return;
    }
    const nextCols = columns.filter(c => c.id !== colId);
    const nextRows = rows.map(r => {
      const nextCells = { ...r.cells };
      delete nextCells[colId];
      return { ...r, cells: nextCells };
    });

    setColumns(nextCols);
    setRows(nextRows);
    commitNow(sheetTitle, nextCols, nextRows);
    showToast('Column removed & saved');
  };

  // Rename column header
  const handleSaveHeader = (colId: string) => {
    if (!newHeaderName.trim()) {
      setEditingHeaderId(null);
      return;
    }
    const nextCols = columns.map(c =>
      c.id === colId ? { ...c, label: newHeaderName.trim() } : c
    );
    setColumns(nextCols);
    setEditingHeaderId(null);
    setNewHeaderName('');
    commitNow(sheetTitle, nextCols, rows);
    showToast('Column renamed & saved');
  };

  // Toggle column type between text and number
  const handleToggleColType = (colId: string) => {
    const nextCols: ColumnDefinition[] = columns.map(c => {
      if (c.id === colId) {
        const nextType: 'text' | 'number' = c.type === 'number' ? 'text' : 'number';
        return { ...c, type: nextType };
      }
      return c;
    });
    setColumns(nextCols);
    commitNow(sheetTitle, nextCols, rows);
  };

  const calculateColSum = (colId: string) => {
    return rows.reduce((acc, row) => {
      const val = row.cells[colId];
      const num = typeof val === 'number' ? val : parseFloat(String(val) || '0');
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  };

  const totalSheetAmount = calculateTotalSheetAmount(columns, rows);

  // CSV Export
  const handleExportCSV = () => {
    const headerRow = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const dataRows = rows.map(r =>
      columns.map(c => `"${String(r.cells[c.id] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${sheetTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported to CSV');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Excel Ribbon & Control Bar */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Title Editing & Live Sync Status */}
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <input
            type="text"
            value={sheetTitle}
            onChange={e => {
              setSheetTitle(e.target.value);
              scheduleAutoSave(e.target.value, columns, rows);
            }}
            placeholder="Worksheet Title"
            className="text-base sm:text-lg font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition-all"
          />

          {/* Auto-Saved Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'unsaved'
                ? 'Syncing changes...'
                : 'Auto-saved in DB'}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Row</span>
          </button>

          <button
            onClick={handleAddColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Columns3 className="w-3.5 h-3.5 text-cyan-600" />
            <span>Add Column</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">CSV Export</span>
          </button>

          {rows.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to clear all ${rows.length} rows in "${sheetTitle}"?`)) {
                  setRows([]);
                  commitNow(sheetTitle, columns, []);
                  showToast('All rows cleared & saved');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold shadow-2xs transition-colors"
              title="Delete all rows in this worksheet"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear Rows</span>
            </button>
          )}

          <button
            onClick={() => {
              commitNow();
              showToast('Worksheet saved to database');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition-all"
            title="Save worksheet now to database"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Now</span>
          </button>

          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete worksheet "${sheetTitle}"?`)) {
                  onDelete(worksheet.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
              title="Delete this entire worksheet"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Formula & Column Quick Info */}
      <div className="bg-slate-100/60 px-4 py-1.5 border-b border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            Rows: <strong className="text-slate-700">{rows.length}</strong>
          </span>
          <span>
            Columns: <strong className="text-slate-700">{columns.length}</strong>
          </span>
          <span className="hidden sm:inline text-slate-500 font-medium">
            🔒 Safe Mode: Every keystroke, row, and column is auto-saved continuously.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Sheet Total:{' '}
            <strong className="text-emerald-700 font-bold">
              ৳ {totalSheetAmount.toLocaleString()}
            </strong>
          </span>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto max-h-[550px] scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-600 select-none border-b border-slate-200">
              <th className="w-12 px-3 py-2.5 text-center font-mono font-semibold text-slate-400 border-r border-slate-200 bg-slate-200/50">
                #
              </th>

              {columns.map((col, index) => {
                const colLetter = String.fromCharCode(65 + (index % 26));
                const isNumeric = col.type === 'number';

                return (
                  <th
                    key={col.id}
                    style={{ minWidth: col.width || 140 }}
                    className="px-3 py-2.5 border-r border-slate-200 group relative font-semibold text-slate-700"
                  >
                    <div className="flex items-center justify-between gap-1">
                      {editingHeaderId === col.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            autoFocus
                            value={newHeaderName}
                            onChange={e => setNewHeaderName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveHeader(col.id);
                              if (e.key === 'Escape') setEditingHeaderId(null);
                            }}
                            className="w-full bg-white px-1.5 py-0.5 rounded border border-emerald-500 text-xs text-slate-800"
                          />
                          <button
                            onClick={() => handleSaveHeader(col.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            onClick={() => {
                              setEditingHeaderId(col.id);
                              setNewHeaderName(col.label);
                            }}
                            className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-700"
                            title="Click to rename"
                          >
                            <span className="font-mono text-[10px] text-slate-400 font-normal">
                              {colLetter}.
                            </span>
                            <span className="truncate">{col.label}</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 text-slate-400" />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleColType(col.id)}
                              title={
                                isNumeric
                                  ? 'Switch to Text column'
                                  : 'Switch to Number/Currency (auto-sums)'
                              }
                              className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight uppercase ${
                                isNumeric
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {isNumeric ? '123' : 'TXT'}
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(col.id)}
                              title="Delete Column"
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </th>
                );
              })}

              <th className="w-12 px-2 py-2.5 text-center text-slate-400"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-8 text-center text-slate-400 text-sm"
                >
                  <p className="font-medium text-slate-500">This worksheet is currently empty.</p>
                  <button
                    onClick={handleAddRow}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Click to add your first row</span>
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={row.id} className="hover:bg-emerald-50/30 group transition-colors">
                  <td className="px-3 py-2 text-center font-mono font-medium text-slate-400 bg-slate-50/50 border-r border-slate-100 select-none">
                    {rowIndex + 1}
                  </td>

                  {columns.map(col => {
                    const cellVal = row.cells[col.id] ?? '';
                    const isNumber = col.type === 'number';

                    return (
                      <td
                        key={col.id}
                        className="px-1.5 py-1 border-r border-slate-100 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:z-10 relative bg-white"
                      >
                        <input
                          type={isNumber ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          value={typeof cellVal === 'boolean' ? String(cellVal) : cellVal}
                          onChange={e => handleCellChange(row.id, col.id, e.target.value)}
                          onBlur={() => commitNow()}
                          placeholder={isNumber ? '0' : '...'}
                          className={`w-full px-2 py-1.5 rounded-sm bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-hidden text-slate-800 transition-colors ${
                            isNumber ? 'text-right font-mono font-medium' : ''
                          }`}
                        />
                      </td>
                    );
                  })}

                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="opacity-50 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot>
            <tr className="bg-slate-100/95 font-semibold text-slate-800 border-t-2 border-slate-300">
              <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-500 border-r border-slate-200">
                ∑
              </td>
              {columns.map(col => {
                const isNumeric = col.type === 'number';
                const sum = isNumeric ? calculateColSum(col.id) : null;

                return (
                  <td
                    key={col.id}
                    className={`px-3 py-2.5 border-r border-slate-200 ${
                      isNumeric
                        ? 'text-right font-mono text-emerald-800 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {isNumeric ? `৳ ${sum?.toLocaleString()}` : '—'}
                  </td>
                );
              })}
              <td className="px-2 py-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
