import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Worksheet, Expenditure, Project, FamilyNote, IncomeCategory, ColumnDefinition } from '../types/family';

const LOCAL_STORAGE_PREFIX = 'family_diary_';

// Unique tailored column schemas for each income category
export function getCategoryDefaultColumns(category: IncomeCategory): ColumnDefinition[] {
  switch (category) {
    case 'tution':
      return [
        { id: 'col_student', label: 'Student Name', type: 'text', width: 160 },
        { id: 'col_class', label: 'Class / Batch', type: 'text', width: 130 },
        { id: 'col_subject', label: 'Subject', type: 'text', width: 130 },
        { id: 'col_fee', label: 'Monthly Fee (৳)', type: 'number', width: 130 },
        { id: 'col_date', label: 'Payment Date', type: 'date', width: 120 },
        { id: 'col_status', label: 'Status (Paid/Due)', type: 'text', width: 130 },
      ];
    case 'father_salary':
      return [
        { id: 'col_month', label: 'Month / Period', type: 'text', width: 130 },
        { id: 'col_org', label: 'Office / Company', type: 'text', width: 160 },
        { id: 'col_basic', label: 'Basic Salary (৳)', type: 'number', width: 130 },
        { id: 'col_rent_allowance', label: 'House Rent (৳)', type: 'number', width: 140 },
        { id: 'col_medical', label: 'Medical & Transport (৳)', type: 'number', width: 150 },
        { id: 'col_bonus', label: 'Bonus / Overtime (৳)', type: 'number', width: 140 },
        { id: 'col_net', label: 'Total Received (৳)', type: 'number', width: 140 },
      ];
    case 'selling_product':
      return [
        { id: 'col_item', label: 'Product Item', type: 'text', width: 160 },
        { id: 'col_qty', label: 'Quantity Sold', type: 'number', width: 110 },
        { id: 'col_rate', label: 'Unit Price (৳)', type: 'number', width: 120 },
        { id: 'col_total', label: 'Total Sales (৳)', type: 'number', width: 130 },
        { id: 'col_channel', label: 'Customer / Channel', type: 'text', width: 150 },
        { id: 'col_date', label: 'Date Sold', type: 'date', width: 120 },
        { id: 'col_mode', label: 'Payment Mode', type: 'text', width: 120 },
      ];
    case 'others_help':
      return [
        { id: 'col_from', label: 'Contributor Name', type: 'text', width: 160 },
        { id: 'col_relation', label: 'Relationship / Source', type: 'text', width: 140 },
        { id: 'col_purpose', label: 'Occasion / Purpose', type: 'text', width: 160 },
        { id: 'col_amount', label: 'Amount Received (৳)', type: 'number', width: 140 },
        { id: 'col_date', label: 'Date Received', type: 'date', width: 120 },
        { id: 'col_remarks', label: 'Remarks / Notes', type: 'text', width: 140 },
      ];
    case 'upcoming_tution':
      return [
        { id: 'col_student', label: 'Student / Batch', type: 'text', width: 160 },
        { id: 'col_class', label: 'Class / Batch', type: 'text', width: 130 },
        { id: 'col_subject', label: 'Subject', type: 'text', width: 130 },
        { id: 'col_fee', label: 'Due Fee (৳)', type: 'number', width: 130 },
        { id: 'col_date', label: 'Expected Date', type: 'date', width: 120 },
      ];
    case 'upcoming_father_salary':
      return [
        { id: 'col_org', label: 'Job / Employer', type: 'text', width: 160 },
        { id: 'col_net', label: 'Expected Salary (৳)', type: 'number', width: 140 },
        { id: 'col_date', label: 'Expected Date', type: 'date', width: 120 },
        { id: 'col_month', label: 'Period / Note', type: 'text', width: 140 },
      ];
    case 'upcoming_due_debt':
      return [
        { id: 'col_from', label: 'Debtor Name', type: 'text', width: 160 },
        { id: 'col_amount', label: 'Due Debt (৳)', type: 'number', width: 140 },
        { id: 'col_date', label: 'Expected Date', type: 'date', width: 120 },
        { id: 'col_purpose', label: 'Debt Context', type: 'text', width: 160 },
      ];
    default:
      return [
        { id: 'col_title', label: 'Item / Description', type: 'text', width: 160 },
        { id: 'col_amount', label: 'Amount (৳)', type: 'number', width: 140 },
        { id: 'col_date', label: 'Date', type: 'date', width: 120 },
      ];
  }
}

// Initial Clean Blank Template Seeds - Each with unique category columns
export const DEFAULT_WORKSHEETS: Worksheet[] = [
  {
    id: 'sheet_tution_1',
    userId: 'guest',
    category: 'tution',
    title: 'Student Tuition Fees',
    columns: getCategoryDefaultColumns('tution'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sheet_salary_1',
    userId: 'guest',
    category: 'father_salary',
    title: 'Father Monthly Salary & Allowances',
    columns: getCategoryDefaultColumns('father_salary'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sheet_selling_1',
    userId: 'guest',
    category: 'selling_product',
    title: 'Product Selling & Commerce',
    columns: getCategoryDefaultColumns('selling_product'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sheet_others_1',
    userId: 'guest',
    category: 'others_help',
    title: 'Family Financial Assistance & Gifts',
    columns: getCategoryDefaultColumns('others_help'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sheet_upcoming_tution',
    userId: 'guest',
    category: 'upcoming_tution',
    title: 'Upcoming Tuition Due',
    columns: getCategoryDefaultColumns('upcoming_tution'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sheet_upcoming_salary',
    userId: 'guest',
    category: 'upcoming_father_salary',
    title: 'Upcoming Father Salary',
    columns: getCategoryDefaultColumns('upcoming_father_salary'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sheet_upcoming_debt',
    userId: 'guest',
    category: 'upcoming_due_debt',
    title: 'Upcoming Due Debt Recovery',
    columns: getCategoryDefaultColumns('upcoming_due_debt'),
    rows: [],
    totalAmount: 0,
    currency: '৳',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_EXPENDITURES: Expenditure[] = [];
export const DEFAULT_PROJECTS: Project[] = [];
export const DEFAULT_NOTES: FamilyNote[] = [];

// Resilient Local Storage Getter with redundant backup fallback
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
    const backupRaw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key + '_backup');
    if (backupRaw) {
      return JSON.parse(backupRaw) as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// Resilient Local Storage Setter with dual-write safety backup
function setLocal<T>(key: string, data: T): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, json);
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key + '_backup', json);
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

/**
 * Recursively strips all `undefined` values from objects and arrays so Firestore `setDoc` never fails.
 * Firestore strictly forbids `undefined` values and throws:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString() as any;
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const sanitized = sanitizeForFirestore(val);
      if (sanitized !== undefined) {
        clean[key] = sanitized;
      }
    }
  }
  return clean as T;
}

// WORKSHEETS SERVICE (Zero-Data-Loss with auto-sync)
export async function getWorksheets(userId: string | null): Promise<Worksheet[]> {
  const local = getLocal<Worksheet[]>('worksheets', DEFAULT_WORKSHEETS);

  if (!userId) {
    return local;
  }

  const path = `users/${userId}/worksheets`;
  try {
    const colRef = collection(db, 'users', userId, 'worksheets');
    const snap = await getDocs(query(colRef));

    if (snap.empty) {
      // User has no documents in Firestore yet.
      // If user has local worksheets with rows or customized titles, preserve them to Firestore!
      const toSync = local.length > 0 ? local : DEFAULT_WORKSHEETS;
      const userSeeds = toSync.map(ws => ({ ...ws, userId }));
      for (const item of userSeeds) {
        await setDoc(doc(db, 'users', userId, 'worksheets', item.id), sanitizeForFirestore(item));
      }
      setLocal('worksheets', userSeeds);
      return userSeeds;
    }

    const firestoreList: Worksheet[] = [];
    snap.forEach(docSnap => {
      firestoreList.push(docSnap.data() as Worksheet);
    });

    // Merge: If local has unsynced sheets or more recent edits, preserve them
    const mergedMap = new Map<string, Worksheet>();
    firestoreList.forEach(ws => mergedMap.set(ws.id, ws));
    local.forEach(loc => {
      const existing = mergedMap.get(loc.id);
      if (!existing) {
        // Upload local sheet to Firestore so it's not lost!
        setDoc(doc(db, 'users', userId, 'worksheets', loc.id), sanitizeForFirestore({ ...loc, userId })).catch(console.warn);
        mergedMap.set(loc.id, { ...loc, userId });
      } else {
        // Compare updatedAt timestamp
        const locTime = new Date(loc.updatedAt || 0).getTime();
        const fireTime = new Date(existing.updatedAt || 0).getTime();
        if (locTime > fireTime) {
          // Local is more recent: update Firestore
          setDoc(doc(db, 'users', userId, 'worksheets', loc.id), sanitizeForFirestore({ ...loc, userId })).catch(console.warn);
          mergedMap.set(loc.id, { ...loc, userId });
        }
      }
    });

    const finalList = Array.from(mergedMap.values());
    setLocal('worksheets', finalList);
    return finalList;
  } catch (err) {
    console.warn('Firestore load worksheets failed, preserving local cache:', err);
    return local;
  }
}

export async function saveWorksheet(userId: string | null, worksheet: Worksheet): Promise<void> {
  const cleanData: Worksheet = {
    ...worksheet,
    userId: userId || 'guest',
    updatedAt: new Date().toISOString(),
  };

  // Immediate dual-local commit (guarantees recent data is never lost)
  const localList = getLocal<Worksheet[]>('worksheets', DEFAULT_WORKSHEETS);
  const idx = localList.findIndex(w => w.id === cleanData.id);
  const updatedList = idx >= 0
    ? [...localList.slice(0, idx), cleanData, ...localList.slice(idx + 1)]
    : [cleanData, ...localList];
  setLocal('worksheets', updatedList);

  // Firestore commit
  if (userId) {
    const path = `users/${userId}/worksheets/${cleanData.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'worksheets', cleanData.id), sanitizeForFirestore(cleanData));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteWorksheet(userId: string | null, worksheetId: string): Promise<void> {
  const localList = getLocal<Worksheet[]>('worksheets', DEFAULT_WORKSHEETS);
  setLocal('worksheets', localList.filter(w => w.id !== worksheetId));

  if (userId) {
    const path = `users/${userId}/worksheets/${worksheetId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'worksheets', worksheetId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// EXPENDITURES SERVICE (Zero-Data-Loss)
export async function getExpenditures(userId: string | null): Promise<Expenditure[]> {
  const local = getLocal<Expenditure[]>('expenditures', DEFAULT_EXPENDITURES);

  if (!userId) {
    return local;
  }

  const path = `users/${userId}/expenditures`;
  try {
    const colRef = collection(db, 'users', userId, 'expenditures');
    const snap = await getDocs(query(colRef));

    if (snap.empty) {
      // If local has expenditures, sync them up so nothing is lost upon login
      if (local.length > 0) {
        for (const exp of local) {
          await setDoc(doc(db, 'users', userId, 'expenditures', exp.id), sanitizeForFirestore({ ...exp, userId }));
        }
      }
      return local;
    }

    const firestoreList: Expenditure[] = [];
    snap.forEach(docSnap => {
      firestoreList.push(docSnap.data() as Expenditure);
    });

    // Merge with any local unsynced expenditures
    const map = new Map<string, Expenditure>();
    firestoreList.forEach(e => map.set(e.id, e));
    local.forEach(e => {
      if (!map.has(e.id)) {
        setDoc(doc(db, 'users', userId, 'expenditures', e.id), sanitizeForFirestore({ ...e, userId })).catch(console.warn);
        map.set(e.id, { ...e, userId });
      }
    });

    const finalList = Array.from(map.values());
    setLocal('expenditures', finalList);
    return finalList;
  } catch (err) {
    console.warn('Firestore load expenditures failed, preserving local cache:', err);
    return local;
  }
}

export async function saveExpenditure(userId: string | null, expenditure: Expenditure): Promise<void> {
  const cleanExp: Expenditure = {
    id: expenditure.id,
    userId: userId || 'guest',
    dates: Array.isArray(expenditure.dates) ? expenditure.dates : [],
    primaryDate: expenditure.primaryDate || '',
    month: expenditure.month || new Date().toISOString().slice(0, 7),
    amount: Number(expenditure.amount) || 0,
    description: expenditure.description || '',
    category: expenditure.category || 'Grocery',
    createdAt: expenditure.createdAt || new Date().toISOString(),
  };

  const localList = getLocal<Expenditure[]>('expenditures', DEFAULT_EXPENDITURES);
  const idx = localList.findIndex(e => e.id === cleanExp.id);
  const updatedList = idx >= 0
    ? [...localList.slice(0, idx), cleanExp, ...localList.slice(idx + 1)]
    : [cleanExp, ...localList];
  setLocal('expenditures', updatedList);

  if (userId) {
    const path = `users/${userId}/expenditures/${cleanExp.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'expenditures', cleanExp.id), sanitizeForFirestore(cleanExp));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteExpenditure(userId: string | null, expenditureId: string): Promise<void> {
  const localList = getLocal<Expenditure[]>('expenditures', DEFAULT_EXPENDITURES);
  setLocal('expenditures', localList.filter(e => e.id !== expenditureId));

  if (userId) {
    const path = `users/${userId}/expenditures/${expenditureId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'expenditures', expenditureId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// PROJECTS SERVICE (Zero-Data-Loss)
export async function getProjects(userId: string | null): Promise<Project[]> {
  const local = getLocal<Project[]>('projects', DEFAULT_PROJECTS);

  if (!userId) {
    return local;
  }

  const path = `users/${userId}/projects`;
  try {
    const colRef = collection(db, 'users', userId, 'projects');
    const snap = await getDocs(query(colRef));

    if (snap.empty) {
      if (local.length > 0) {
        for (const proj of local) {
          await setDoc(doc(db, 'users', userId, 'projects', proj.id), sanitizeForFirestore({ ...proj, userId }));
        }
      }
      return local;
    }

    const firestoreList: Project[] = [];
    snap.forEach(docSnap => {
      firestoreList.push(docSnap.data() as Project);
    });

    const map = new Map<string, Project>();
    firestoreList.forEach(p => map.set(p.id, p));
    local.forEach(p => {
      if (!map.has(p.id)) {
        setDoc(doc(db, 'users', userId, 'projects', p.id), sanitizeForFirestore({ ...p, userId })).catch(console.warn);
        map.set(p.id, { ...p, userId });
      }
    });

    const finalList = Array.from(map.values());
    setLocal('projects', finalList);
    return finalList;
  } catch (err) {
    console.warn('Firestore load projects failed, preserving local cache:', err);
    return local;
  }
}

export async function saveProject(userId: string | null, project: Project): Promise<void> {
  const cleanProj: Project = {
    id: project.id,
    userId: userId || 'guest',
    title: project.title || '',
    category: project.category || 'payable_debt',
    description: project.description || '',
    amount: Number(project.amount) || 0,
    initialAmount: Number(project.initialAmount ?? project.amount ?? 0),
    paidAmount: Number(project.paidAmount || 0),
    expectedAmount: Number(project.expectedAmount ?? project.amount ?? 0),
    status: project.status || 'pending',
    expectedDate: project.expectedDate || '',
    isUndated: Boolean(project.isUndated),
    targetHorizon: project.targetHorizon || 'this_month',
    targetMonth: project.targetMonth || '',
    targetDeadline: project.targetDeadline || '',
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
    paymentHistory: Array.isArray(project.paymentHistory) ? project.paymentHistory : [],
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (project.completedAt) {
    cleanProj.completedAt = project.completedAt;
  }

  const localList = getLocal<Project[]>('projects', DEFAULT_PROJECTS);
  const idx = localList.findIndex(p => p.id === cleanProj.id);
  const updatedList = idx >= 0
    ? [...localList.slice(0, idx), cleanProj, ...localList.slice(idx + 1)]
    : [cleanProj, ...localList];
  setLocal('projects', updatedList);

  if (userId) {
    const path = `users/${userId}/projects/${cleanProj.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'projects', cleanProj.id), sanitizeForFirestore(cleanProj));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteProject(userId: string | null, projectId: string): Promise<void> {
  const localList = getLocal<Project[]>('projects', DEFAULT_PROJECTS);
  setLocal('projects', localList.filter(p => p.id !== projectId));

  if (userId) {
    const path = `users/${userId}/projects/${projectId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// NOTES SERVICE (Zero-Data-Loss)
export async function getNotes(userId: string | null): Promise<FamilyNote[]> {
  const local = getLocal<FamilyNote[]>('notes', DEFAULT_NOTES);

  if (!userId) {
    return local;
  }

  const path = `users/${userId}/notes`;
  try {
    const colRef = collection(db, 'users', userId, 'notes');
    const snap = await getDocs(query(colRef));

    if (snap.empty) {
      if (local.length > 0) {
        for (const n of local) {
          await setDoc(doc(db, 'users', userId, 'notes', n.id), sanitizeForFirestore({ ...n, userId }));
        }
      }
      return local;
    }

    const firestoreList: FamilyNote[] = [];
    snap.forEach(docSnap => {
      firestoreList.push(docSnap.data() as FamilyNote);
    });

    const map = new Map<string, FamilyNote>();
    firestoreList.forEach(n => map.set(n.id, n));
    local.forEach(n => {
      if (!map.has(n.id)) {
        setDoc(doc(db, 'users', userId, 'notes', n.id), sanitizeForFirestore({ ...n, userId })).catch(console.warn);
        map.set(n.id, { ...n, userId });
      }
    });

    const finalList = Array.from(map.values());
    setLocal('notes', finalList);
    return finalList;
  } catch (err) {
    return local;
  }
}

export async function saveNote(userId: string | null, note: FamilyNote): Promise<void> {
  const cleanNote: FamilyNote = {
    ...note,
    userId: userId || 'guest',
  };

  const localList = getLocal<FamilyNote[]>('notes', DEFAULT_NOTES);
  const idx = localList.findIndex(n => n.id === cleanNote.id);
  const updated = idx >= 0 ? [...localList.slice(0, idx), cleanNote, ...localList.slice(idx + 1)] : [cleanNote, ...localList];
  setLocal('notes', updated);

  if (userId) {
    const path = `users/${userId}/notes/${cleanNote.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'notes', cleanNote.id), sanitizeForFirestore(cleanNote));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteNote(userId: string | null, noteId: string): Promise<void> {
  const localList = getLocal<FamilyNote[]>('notes', DEFAULT_NOTES);
  setLocal('notes', localList.filter(n => n.id !== noteId));

  if (userId) {
    const path = `users/${userId}/notes/${noteId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// RESET ALL DATA EXPLICITLY (Only triggered on user manual button press)
export async function resetAllDatabaseData(userId: string | null): Promise<{
  worksheets: Worksheet[];
  expenditures: Expenditure[];
  projects: Project[];
  notes: FamilyNote[];
}> {
  const cleanWorksheets = DEFAULT_WORKSHEETS.map(w => ({
    ...w,
    userId: userId || 'guest',
    rows: [],
    totalAmount: 0,
    updatedAt: new Date().toISOString(),
  }));

  setLocal('worksheets', cleanWorksheets);
  setLocal('expenditures', []);
  setLocal('projects', []);
  setLocal('notes', []);

  if (userId) {
    try {
      const expSnap = await getDocs(collection(db, 'users', userId, 'expenditures'));
      for (const d of expSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'expenditures', d.id));
      }
      const projSnap = await getDocs(collection(db, 'users', userId, 'projects'));
      for (const d of projSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'projects', d.id));
      }
      const notesSnap = await getDocs(collection(db, 'users', userId, 'notes'));
      for (const d of notesSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'notes', d.id));
      }
      const wsSnap = await getDocs(collection(db, 'users', userId, 'worksheets'));
      for (const d of wsSnap.docs) {
        await deleteDoc(doc(db, 'users', userId, 'worksheets', d.id));
      }
      for (const item of cleanWorksheets) {
        await setDoc(doc(db, 'users', userId, 'worksheets', item.id), sanitizeForFirestore(item));
      }
    } catch (e) {
      console.warn('Error clearing Firestore documents during manual reset:', e);
    }
  }

  return {
    worksheets: cleanWorksheets,
    expenditures: [],
    projects: [],
    notes: [],
  };
}
