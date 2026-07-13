import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    // Authenticate: Only super admins can export/download the combined marksheet
    await requireAuth(['SUPER_ADMIN']);

    const { searchParams } = new URL(request.url);
    const classCategory = searchParams.get('classCategory');
    const termId = searchParams.get('termId') || '';
    const sessionId = searchParams.get('sessionId') || '';

    if (!classCategory) {
      return NextResponse.json({ error: 'Missing required parameter: classCategory' }, { status: 400 });
    }

    // Determine the term and session to use
    let targetTermId = termId;
    let termName = '';
    if (!targetTermId) {
      const activeTerm = await db.term.findFirst({ where: { active: true } });
      if (!activeTerm) {
        return NextResponse.json({ error: 'No active term set in the system. Please specify termId.' }, { status: 400 });
      }
      targetTermId = activeTerm.id;
      termName = activeTerm.name;
    } else {
      const term = await db.term.findUnique({ where: { id: targetTermId } });
      if (!term) {
        return NextResponse.json({ error: 'Specified term not found.' }, { status: 400 });
      }
      termName = term.name;
    }

    let targetSessionId = sessionId;
    let sessionName = '';
    if (!targetSessionId) {
      const activeSession = await db.session.findFirst({ where: { active: true } });
      if (!activeSession) {
        return NextResponse.json({ error: 'No active session set in the system. Please specify sessionId.' }, { status: 400 });
      }
      targetSessionId = activeSession.id;
      sessionName = activeSession.name;
    } else {
      const session = await db.session.findUnique({ where: { id: targetSessionId } });
      if (!session) {
        return NextResponse.json({ error: 'Specified session not found.' }, { status: 400 });
      }
      sessionName = session.name;
    }

    // Get all classes matching the classCategory prefix
    const allClasses = await db.class.findMany();
    const matchedClasses = allClasses.filter(c => 
      c.name.trim().toUpperCase().startsWith(classCategory.trim().toUpperCase())
    );

    if (matchedClasses.length === 0) {
      return NextResponse.json({ error: `No classes found for category "${classCategory}".` }, { status: 404 });
    }

    const classIds = matchedClasses.map(c => c.id);

    // Fetch all students in the matched classes for the selected session
    const students = await db.student.findMany({
      where: {
        classId: { in: classIds },
        sessionId: targetSessionId
      },
      select: {
        id: true,
        fullName: true,
        gender: true
      }
    });

    if (students.length === 0) {
      return NextResponse.json({ error: `No students found in category "${classCategory}" for the selected term/session.` }, { status: 404 });
    }

    // Fetch all results for these students in the selected term/session
    const results = await db.result.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        termId: targetTermId,
        sessionId: targetSessionId
      },
      include: {
        subject: true
      }
    });

    if (results.length === 0) {
      return NextResponse.json({ error: 'No marksheet entries found for this selection.' }, { status: 404 });
    }

    // Determine qualifying subjects: subject must have at least one score > 0
    const subjectsMap = new Map<string, { id: string; name: string }>();
    const qualifyingSubjectIds = new Set<string>();

    for (const res of results) {
      if (res.caScore > 0 || res.examScore > 0) {
        qualifyingSubjectIds.add(res.subjectId);
        subjectsMap.set(res.subjectId, res.subject);
      }
    }

    if (qualifyingSubjectIds.size === 0) {
      return NextResponse.json({ error: 'No subjects have entries with score > 0 in this class category.' }, { status: 404 });
    }

    // Sort subjects alphabetically
    const sortedSubjects = Array.from(subjectsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    // Sort students: Boys first, then Girls, and alphabetically within each gender group
    const sortedStudents = [...students].sort((a, b) => {
      const gA = String(a.gender || '').trim().toUpperCase();
      const gB = String(b.gender || '').trim().toUpperCase();

      const isMaleA = gA === 'MALE' || gA === 'BOY' || gA === 'M';
      const isMaleB = gB === 'MALE' || gB === 'BOY' || gB === 'M';
      const isFemaleA = gA === 'FEMALE' || gA === 'GIRL' || gA === 'F';
      const isFemaleB = gB === 'FEMALE' || gB === 'GIRL' || gB === 'F';

      if (isMaleA && !isMaleB) return -1;
      if (!isMaleA && isMaleB) return 1;

      if (isFemaleA && !isFemaleB) return -1;
      if (!isFemaleA && isFemaleB) return 1;

      // Fallback alphabetical sort by full name
      return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
    });

    // Map student results by studentId -> subjectId
    const resultMap = new Map<string, Map<string, { caScore: number; examScore: number }>>();
    for (const res of results) {
      if (!resultMap.has(res.studentId)) {
        resultMap.set(res.studentId, new Map());
      }
      resultMap.get(res.studentId)!.set(res.subjectId, {
        caScore: res.caScore,
        examScore: res.examScore
      });
    }

    // Build the sheet rows
    // Row 1: Merged headers for subjects (A1 is empty)
    const row1: any[] = [''];
    // Row 2: Sub-headers ("Student Name", CA, Exam repeating)
    const row2: any[] = ['Student Name'];

    const merges: any[] = [];
    const cols: any[] = [{ wch: 35 }]; // Column A width (Student Name)

    sortedSubjects.forEach((subject, idx) => {
      // Row 1 gets the Subject Name on the first column of the merge pair
      row1.push(subject.name, '');
      // Row 2 gets "CA" and "Exam"
      row2.push('CA', 'Exam');

      // 0-indexed column coordinates for the merge pair
      const colStart = 1 + idx * 2;
      const colEnd = 2 + idx * 2;
      merges.push({ s: { r: 0, c: colStart }, e: { r: 0, c: colEnd } });

      // Column widths for CA and Exam
      cols.push({ wch: 8 }, { wch: 8 });
    });

    const dataRows = sortedStudents.map(student => {
      // Cell 0: Student Name (ID)
      const studentLabel = `${student.fullName} (${student.id})`;
      const row: any[] = [studentLabel];

      const studentResults = resultMap.get(student.id);

      sortedSubjects.forEach(subject => {
        const scoreEntry = studentResults?.get(subject.id);
        if (scoreEntry !== undefined) {
          row.push(scoreEntry.caScore, scoreEntry.examScore);
        } else {
          // Leave truly empty (null or undefined)
          row.push('', '');
        }
      });

      return row;
    });

    // Generate workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows]);
    ws['!merges'] = merges;
    ws['!cols'] = cols;
    
    // Freeze Row 1-2 and Column A
    ws['!views'] = [
      {
        state: 'frozen',
        xSplit: 1,
        ySplit: 2,
        topLeftCell: 'B3',
        activePane: 'bottomRight'
      }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Marksheet');

    // Write file to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Format clean filenames: replace spaces and slashes
    const sanitizedTerm = termName.replace(/\s+/g, '-');
    const sanitizedSession = sessionName.replace(/\//g, '-');
    const filename = `${classCategory}_Marksheet_${sanitizedTerm}_${sanitizedSession}.xlsx`;

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
