/**
 * Static seed data for Doxa Christian Academy (DOXA week packets as lesson plans).
 * School / Wednesday / Friday columns map to Tue / Wed / Fri of the current
 * Sunday–Saturday week (org school days are configurable in settings; this seed
 * still follows the printed packet columns).
 */

export const ORG = {
  name: "Doxa Christian Academy",
  slug: "doxa-christian-academy",
  org_type: "coop" as const,
  grade_scheme: "k12" as const,
};

export type WeekDates = {
  /** Short label for titles, e.g. "Sept 20–26, 2026". */
  label: string;
  /** In-person “School” column → Tuesday. */
  school: string;
  wednesday: string;
  thursday: string;
  friday: string;
  /** Bulletin + unit window: Sunday–Saturday of the anchor week. */
  unitStart: string;
  unitEnd: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function localYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return next;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Sunday–Saturday week containing `anchor` (local calendar). */
export function resolveWeek(anchor: Date = new Date()): WeekDates {
  const sunday = addDays(anchor, -anchor.getDay());
  const saturday = addDays(sunday, 6);
  const school = addDays(sunday, 2);
  const wednesday = addDays(sunday, 3);
  const thursday = addDays(sunday, 4);
  const friday = addDays(sunday, 5);

  const sameMonth = sunday.getMonth() === saturday.getMonth();
  const label = sameMonth
    ? `${MONTH_SHORT[sunday.getMonth()]} ${sunday.getDate()}–${saturday.getDate()}, ${sunday.getFullYear()}`
    : `${MONTH_SHORT[sunday.getMonth()]} ${sunday.getDate()} – ${MONTH_SHORT[saturday.getMonth()]} ${saturday.getDate()}, ${saturday.getFullYear()}`;

  return {
    label,
    school: localYmd(school),
    wednesday: localYmd(wednesday),
    thursday: localYmd(thursday),
    friday: localYmd(friday),
    unitStart: localYmd(sunday),
    unitEnd: localYmd(saturday),
  };
}

/** Resolved at module load so a single seed run shares one week. */
export const WEEK: WeekDates = resolveWeek();

export const LUKE = {
  email: "lukeharwood11@gmail.com",
  name: "Luke Harwood",
  role: "owner" as const,
};

export const LANA = {
  email: "adamandlana@gmail.com",
  name: "Lana Harwood",
  role: "instructor" as const,
};

/** Fake instructors — emails are created as confirmed Auth users for testing. */
export const SEED_TEACHERS: { email: string; name: string; subjects: string[] }[] =
  [
    {
      email: "doxa.seed+math@coursewright.com",
      name: "Grace Bennett",
      subjects: ["Math"],
    },
    {
      email: "doxa.seed+omnibus@coursewright.com",
      name: "Daniel Whitaker",
      subjects: ["Omnibus", "History", "Literature", "Bible"],
    },
    {
      email: "doxa.seed+science@coursewright.com",
      name: "Hannah Cole",
      subjects: ["Science"],
    },
    {
      email: "doxa.seed+language@coursewright.com",
      name: "Margaret Ellison",
      subjects: ["Grammar", "Greek", "Logic", "Rhetoric"],
    },
    {
      email: "doxa.seed+arts@coursewright.com",
      name: "Peter Lang",
      subjects: ["Music", "Art"],
    },
  ];

export type StudentSeed = {
  name: string;
  grade: string;
  parentEmail: string;
};

export const HARWOOD_KIDS: StudentSeed[] = [
  {
    name: "Ava Harwood",
    grade: "8",
    parentEmail: "adamandlana@gmail.com",
  },
  {
    name: "Landon Harwood",
    grade: "5",
    parentEmail: "adamandlana@gmail.com",
  },
];

/** Extra roster for a full-looking co-op. */
export const FAKE_STUDENTS: StudentSeed[] = [
  { name: "Noah Caldwell", grade: "4", parentEmail: "parent.caldwell@example.com" },
  { name: "Emma Caldwell", grade: "6", parentEmail: "parent.caldwell@example.com" },
  { name: "Oliver Price", grade: "4", parentEmail: "parent.price@example.com" },
  { name: "Sophia Nguyen", grade: "5", parentEmail: "parent.nguyen@example.com" },
  { name: "Liam Brooks", grade: "5", parentEmail: "parent.brooks@example.com" },
  { name: "Mia Torres", grade: "6", parentEmail: "parent.torres@example.com" },
  { name: "Ethan Walsh", grade: "6", parentEmail: "parent.walsh@example.com" },
  { name: "Charlotte Kim", grade: "7", parentEmail: "parent.kim@example.com" },
  { name: "James Ortega", grade: "7", parentEmail: "parent.ortega@example.com" },
  { name: "Amelia Foster", grade: "8", parentEmail: "parent.foster@example.com" },
  { name: "Benjamin Hayes", grade: "8", parentEmail: "parent.hayes@example.com" },
  { name: "Harper Singh", grade: "9", parentEmail: "parent.singh@example.com" },
  { name: "Henry Sullivan", grade: "9", parentEmail: "parent.sullivan@example.com" },
  { name: "Evelyn Marsh", grade: "4", parentEmail: "parent.marsh@example.com" },
  { name: "Jack Rivera", grade: "7", parentEmail: "parent.rivera@example.com" },
  { name: "Isla Quinn", grade: "9", parentEmail: "parent.quinn@example.com" },
];

export type CourseSeed = {
  key: string;
  title: string;
  subject: string;
  description: string;
  gradeLevels: string[];
  /** Grades enrolled into this course. */
  enrollGrades: string[];
  /** Prefer matching teacher by subject keyword; falls back to Lana. */
  teacherSubject?: string;
  location?: string;
};

export const COURSES: CourseSeed[] = [
  {
    key: "weekly-bulletin",
    title: "Weekly Bulletin",
    subject: "Home & Formation",
    description:
      "Org-wide notes, scripture, catechism, and wisdom of the week — posted as a weekly lesson plan.",
    gradeLevels: ["4", "5", "6", "7", "8", "9"],
    enrollGrades: ["4", "5", "6", "7", "8", "9"],
    teacherSubject: "Bible",
  },
  // 4–6
  {
    key: "math-4",
    title: "Math 4",
    subject: "Math",
    description: "4th grade math — lessons and fact practice.",
    gradeLevels: ["4"],
    enrollGrades: ["4"],
    teacherSubject: "Math",
  },
  {
    key: "math-5",
    title: "Math 5",
    subject: "Math",
    description: "5th grade math — lessons and timed facts.",
    gradeLevels: ["5"],
    enrollGrades: ["5"],
    teacherSubject: "Math",
  },
  {
    key: "math-6",
    title: "Math 6",
    subject: "Math",
    description: "6th grade math — lessons and fact practice.",
    gradeLevels: ["6"],
    enrollGrades: ["6"],
    teacherSubject: "Math",
  },
  {
    key: "grammar-4",
    title: "Grammar & Writing 4",
    subject: "Grammar",
    description: "Well-Ordered Language + Writing & Rhetoric (4th).",
    gradeLevels: ["4"],
    enrollGrades: ["4"],
    teacherSubject: "Grammar",
  },
  {
    key: "grammar-56",
    title: "Grammar & Writing 5–6",
    subject: "Grammar",
    description: "Sentence diagramming + Chreia & Proverb.",
    gradeLevels: ["5", "6"],
    enrollGrades: ["5", "6"],
    teacherSubject: "Grammar",
  },
  {
    key: "history-46",
    title: "History 4–6",
    subject: "History",
    description: "History cards, map work, and narrations.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "History",
  },
  {
    key: "science-46",
    title: "Science 4–6",
    subject: "Science",
    description: "Sky watching, constellations, and nature study.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "Science",
  },
  {
    key: "swr-46",
    title: "Spelling & Phonics (SWR)",
    subject: "Spelling",
    description: "Spell to Write and Read lists and quizzes.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "Grammar",
  },
  {
    key: "literature-46",
    title: "Literature 4–6",
    subject: "Literature",
    description: "Reading, narrations, and money-making project planning.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "Literature",
  },
  {
    key: "music-46",
    title: "Music 4–6",
    subject: "Music",
    description: "Melodic and rhythmic review; see class channel for audio.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "Music",
  },
  {
    key: "greek-4",
    title: "Greek 4",
    subject: "Greek",
    description: "Alphabet review and John “I am” statements.",
    gradeLevels: ["4"],
    enrollGrades: ["4"],
    teacherSubject: "Greek",
  },
  {
    key: "greek-56",
    title: "Greek 5–6",
    subject: "Greek",
    description: "Mark 1 reading and pronunciation.",
    gradeLevels: ["5", "6"],
    enrollGrades: ["5", "6"],
    teacherSubject: "Greek",
  },
  {
    key: "bible-46",
    title: "Bible 4–6",
    subject: "Bible",
    description: "Mark chapter study with map work.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "Bible",
  },
  {
    key: "art-46",
    title: "Art 4–6",
    subject: "Art",
    description: "Fancy arrows — symmetry and detail.",
    gradeLevels: ["4", "5", "6"],
    enrollGrades: ["4", "5", "6"],
    teacherSubject: "Art",
  },
  // 7–9
  {
    key: "math-87",
    title: "Math 8/7",
    subject: "Math",
    description: "Saxon Math 8/7.",
    gradeLevels: ["7", "8"],
    enrollGrades: ["7"],
    teacherSubject: "Math",
  },
  {
    key: "algebra-1",
    title: "Algebra 1",
    subject: "Math",
    description: "Algebra 1 lessons, problem sets, and timed tests.",
    gradeLevels: ["8", "9"],
    enrollGrades: ["8"],
    teacherSubject: "Math",
  },
  {
    key: "algebra-2",
    title: "Algebra 2",
    subject: "Math",
    description: "Algebra 2 lessons, problem sets, and timed tests.",
    gradeLevels: ["9"],
    enrollGrades: ["9"],
    teacherSubject: "Math",
  },
  {
    key: "grammar-78",
    title: "Grammar & Writing 7–8",
    subject: "Grammar",
    description: "Our Mother Tongue + hymn literary devices.",
    gradeLevels: ["7", "8"],
    enrollGrades: ["7", "8"],
    teacherSubject: "Grammar",
  },
  {
    key: "omnibus",
    title: "Omnibus",
    subject: "Omnibus",
    description: "Genesis, Epic of Creation, Epic of Gilgamesh.",
    gradeLevels: ["7", "8", "9"],
    enrollGrades: ["7", "8", "9"],
    teacherSubject: "Omnibus",
  },
  {
    key: "earth-science",
    title: "Earth Science 7–8",
    subject: "Science",
    description: "Earth Science — weathering, erosion, soils.",
    gradeLevels: ["7", "8"],
    enrollGrades: ["7", "8"],
    teacherSubject: "Science",
  },
  {
    key: "physical-science-9",
    title: "Physical Science 9",
    subject: "Science",
    description: "Motion, velocity, and acceleration.",
    gradeLevels: ["9"],
    enrollGrades: ["9"],
    teacherSubject: "Science",
  },
  {
    key: "logic-1",
    title: "Logic 1",
    subject: "Logic",
    description: "Introductory logic review and exercises.",
    gradeLevels: ["7", "8"],
    enrollGrades: ["7", "8"],
    teacherSubject: "Logic",
  },
  {
    key: "logic-2",
    title: "Logic 2",
    subject: "Logic",
    description: "Conditionals; prepare for Test #1.",
    gradeLevels: ["9"],
    enrollGrades: ["9"],
    teacherSubject: "Logic",
  },
  {
    key: "rhetoric-9",
    title: "Rhetoric 9",
    subject: "Rhetoric",
    description: "Persuasive features — Luther and Williamson.",
    gradeLevels: ["9"],
    enrollGrades: ["9"],
    teacherSubject: "Rhetoric",
  },
  {
    key: "greek-7",
    title: "Greek 7",
    subject: "Greek",
    description: "Pronunciation, recitation, and Logos Book One.",
    gradeLevels: ["7"],
    enrollGrades: ["7"],
    teacherSubject: "Greek",
  },
  {
    key: "greek-89",
    title: "Greek 8–9",
    subject: "Greek",
    description: "Jonah in Greek — inductive reading.",
    gradeLevels: ["8", "9"],
    enrollGrades: ["8", "9"],
    teacherSubject: "Greek",
  },
  {
    key: "music-7",
    title: "Music 7",
    subject: "Music",
    description: "Rhythms, do pentatone, ostinato, and sight-reading.",
    gradeLevels: ["7"],
    enrollGrades: ["7"],
    teacherSubject: "Music",
  },
  {
    key: "music-89",
    title: "Music 8–9",
    subject: "Music",
    description: "Drone exercises, major scales, singing catechism.",
    gradeLevels: ["8", "9"],
    enrollGrades: ["8", "9"],
    teacherSubject: "Music",
  },
  {
    key: "art-79",
    title: "Art 7–9",
    subject: "Art",
    description: "Contour drawing and toned paper (Dürer study).",
    gradeLevels: ["7", "8", "9"],
    enrollGrades: ["7", "8", "9"],
    teacherSubject: "Art",
  },
];

export type DayKey = "school" | "wednesday" | "friday";

/** One packet item that becomes a lesson-plan day note. Date window is the current week. */
export type BulletinSeed = {
  courseKey: string;
  /** Packet column — titles only; availability is the full week. */
  day: DayKey;
  title: string;
  body: string[];
};

export const WEEK_BULLETINS: BulletinSeed[] = [
  // —— Weekly Bulletin (all students) ——
  {
    courseKey: "weekly-bulletin",
    day: "school",
    title: `Week notes — ${WEEK.label}`,
    body: [
      "Notes",
      "Upper school (7–9): Students have their first take-home assessment in Omnibus. Complete it independently without notes or other resources. Students may use their books (Bible, Epic of Creation, Epic of Gilgamesh).",
      "Lower school (4–6): See each course for this week’s home lesson plan.",
    ],
  },
  {
    courseKey: "weekly-bulletin",
    day: "school",
    title: "Scripture memory — 1 Peter 2:3",
    body: [
      "Scripture Memory Work",
      "1 Peter 2:3 ESV — if indeed you have tasted that the Lord is good.",
    ],
  },
  {
    courseKey: "weekly-bulletin",
    day: "school",
    title: "Catechism — Question 29",
    body: [
      "New City Catechism Memory Work",
      "Question 29 — How can we be saved?",
      "Only by faith in Jesus Christ and in his substitutionary atoning death on the cross.",
    ],
  },
  {
    courseKey: "weekly-bulletin",
    day: "school",
    title: "Wisdom of the Week",
    body: ["Wisdom of the Week", "The strong… help the weak."],
  },

  // —— Math 4 ——
  {
    courseKey: "math-4",
    day: "school",
    title: "Math 4 — School",
    body: [
      "Check home day work from Friday. File M and D facts.",
      "Warm up brains with mental math.",
      "Thurs – Lessons 7–10",
    ],
  },
  {
    courseKey: "math-4",
    day: "wednesday",
    title: "Math 4 — Wednesday",
    body: ["Complete lesson 8 Mixed Practice, evens only."],
  },
  {
    courseKey: "math-4",
    day: "friday",
    title: "Math 4 — Friday",
    body: [
      "Complete as many multiplication and division facts as you are able in 3 minutes. Record the number completed at the top of the page.",
      "In your math notebook, complete lesson 10 Mixed Practice, evens only.",
    ],
  },

  // —— Math 5 ——
  {
    courseKey: "math-5",
    day: "school",
    title: "Math 5 — School",
    body: ["Timed addition fact test, mental math facts, Lessons 5–8"],
  },
  {
    courseKey: "math-5",
    day: "wednesday",
    title: "Math 5 — Wednesday",
    body: ["Lesson 5 Practice set all and Problem Set odds"],
  },
  {
    courseKey: "math-5",
    day: "friday",
    title: "Math 5 — Friday",
    body: [
      "Lesson 7 practice set all letters.",
      "Lesson 8 practice set all letters and problem set odds.",
    ],
  },

  // —— Math 6 ——
  {
    courseKey: "math-6",
    day: "school",
    title: "Math 6 — School",
    body: [
      "Check home day work from Friday. Check on M and D facts. File these.",
      "Warm up brains with mental math.",
      "Thurs – Lessons 4–6",
    ],
  },
  {
    courseKey: "math-6",
    day: "wednesday",
    title: "Math 6 — Wednesday",
    body: ["Complete lesson 8 Mixed Practice, evens only."],
  },
  {
    courseKey: "math-6",
    day: "friday",
    title: "Math 6 — Friday",
    body: [
      "Complete as many multiplication and division facts as you are able in 3 minutes. Record the number completed at the top of the page.",
      "In your math notebook, complete lesson 10 Mixed Practice, evens only.",
    ],
  },

  // —— Grammar 4 ——
  {
    courseKey: "grammar-4",
    day: "school",
    title: "Grammar 4 — School (Adverbs & parables)",
    body: [
      "Chapter 2: Adverbs",
      "What is an adverb? An adverb modifies a verb, an adjective, or another adverb.",
      "Writing: What is a parable? A parable is a short story based on real life that teaches a moral or spiritual lesson.",
    ],
  },
  {
    courseKey: "grammar-4",
    day: "wednesday",
    title: "Grammar 4 — Wednesday",
    body: [
      "Complete 2B (pages 38–39) in Well-Ordered Language.",
      "Parents, ask your students about the poem “Fable.”",
      "Students should memorize the first nine lines by next Thursday.",
    ],
  },
  {
    courseKey: "grammar-4",
    day: "friday",
    title: "Grammar 4 — Friday",
    body: [
      "In your Writing and Rhetoric workbook, complete pages 18–19 (and just the very top of 20). Parents, please make sure sentences are complete.",
      "Keep memorizing “Fable.”",
    ],
  },

  // —— Grammar 5–6 ——
  {
    courseKey: "grammar-56",
    day: "school",
    title: "Grammar 5–6 — School",
    body: [
      "Review how to diagram various types of sentences.",
      "Writing: Begin W&R Chreia & Proverb",
      "What is a chreia? A chreia is a short essay that praises the author of a saying and shows why the saying is useful.",
    ],
  },
  {
    courseKey: "grammar-56",
    day: "wednesday",
    title: "Grammar 5–6 — Wednesday",
    body: [
      "Complete Chapter 2 Exercise A (pages 40–41).",
      "Finish your chart on the Tongue Twister handout. Then write a creative sentence or two below.",
    ],
  },
  {
    courseKey: "grammar-56",
    day: "friday",
    title: "Grammar 5–6 — Friday",
    body: [
      "In your Writing and Rhetoric workbook, finish reading the lesson on page 5.",
      "Orally answer the questions in “Tell It Back” to a parent (p.6). Under “Talk About It” discuss #4 and write this saying down.",
      "Memorize the first stanza of “A Psalm of Life.”",
    ],
  },

  // —— History / Science / SWR / Literature / Music / Greek / Bible / Art 4–6 ——
  {
    courseKey: "history-46",
    day: "school",
    title: "History — School",
    body: [
      "Listen to the history song.",
      "Have a student read card 2 on the Fall in the Garden. Students fill out the sheet after listening carefully.",
      "Discuss the history of work. Define work as magnification of God’s goodness.",
    ],
  },
  {
    courseKey: "history-46",
    day: "wednesday",
    title: "History — Wednesday",
    body: [
      "Examine the map of the Mediterranean region. Complete the worksheet for the fall, front and back. Write in cursive.",
      "Write a narration for the life of Otzi (half page for 4th; at least a page for older students).",
    ],
  },
  {
    courseKey: "history-46",
    day: "friday",
    title: "History — Friday",
    body: [
      "Finish Otzi story if you didn’t already. Make sure you write in cursive. Invent how he got broken bones / the arrow — don’t only list facts.",
    ],
  },
  {
    courseKey: "science-46",
    day: "school",
    title: "Science — School",
    body: [
      "Sing together: I Sing the Mighty Power of God. Talk about the poetry in the song.",
      "Show students where the planets are in the sky. Identify a few constellations and record them on the star chart.",
    ],
  },
  {
    courseKey: "science-46",
    day: "wednesday",
    title: "Science — Wednesday / this week",
    body: [
      "Sometime this week or next: Go outside after dark and find a few of the constellations on your star chart. Have a parent check.",
      "Fill them in on your blank star chart. If you have a telescope, look at the moon and a few planets (Saturn SE after dark).",
    ],
  },
  {
    courseKey: "science-46",
    day: "friday",
    title: "Science — Friday",
    body: ["See Wednesday — finish constellation work if needed."],
  },
  {
    courseKey: "swr-46",
    day: "school",
    title: "SWR — School",
    body: [
      "Introduce new lists to 5th and 6th grade. Go over the rules and phonograms. Correct the spelling in their writing.",
    ],
  },
  {
    courseKey: "swr-46",
    day: "wednesday",
    title: "SWR — Wednesday",
    body: [
      "4th Grade – When ready, parents should give the spelling quiz for N-2 (today or Friday).",
      "5th and 6th – practice your spelling list (write each word twice if unsure).",
      "Finish writing Nothing Gold Can Stay in very nice cursive.",
    ],
  },
  {
    courseKey: "literature-46",
    day: "school",
    title: "Literature — School",
    body: [
      "Discuss Summer of the Monkeys.",
      "Read more of David Livingstone. Instruct on how to write narrations.",
    ],
  },
  {
    courseKey: "literature-46",
    day: "wednesday",
    title: "Literature — Wednesday",
    body: ["Spend at least 30 minutes in your reading book today."],
  },
  {
    courseKey: "literature-46",
    day: "friday",
    title: "Literature — Friday (money-making project)",
    body: [
      "Look again at your list of ideas to earn the money amount you decided on.",
      "Work with your parents to decide. Do something hard or a little scary.",
      "Write about what you’re going to do and list the steps in order.",
    ],
  },
  {
    courseKey: "music-46",
    day: "school",
    title: "Music — School",
    body: [
      "Review of known melodic elements (do pentatone and low la).",
      "Review of known rhythmic elements (eighth and sixteenth notes).",
      "Prep of melodic element low so.",
      "Please see the WhatsApp channel for photos and audio from class.",
    ],
  },
  {
    courseKey: "music-46",
    day: "friday",
    title: "Music — Friday",
    body: ["If you didn’t get to Wednesday’s items, please do so today."],
  },
  {
    courseKey: "greek-4",
    day: "school",
    title: "Greek 4 — School",
    body: [
      "New students and 4th grade – review alphabet. Work on pronouncing the I am statements in John.",
    ],
  },
  {
    courseKey: "greek-4",
    day: "wednesday",
    title: "Greek 4 — Wednesday",
    body: [
      "Work on saying the “I am” verses from John out loud. Get through as many as you can — pronunciation practice, not finishing every verse.",
    ],
  },
  {
    courseKey: "greek-56",
    day: "school",
    title: "Greek 5–6 — School",
    body: ["5th and 6th grade – Review reading with Mark 1:16–20."],
  },
  {
    courseKey: "greek-56",
    day: "wednesday",
    title: "Greek 5–6 — Wednesday",
    body: [
      "Practice saying Mark 1:16–17 out loud, thinking about what it means.",
      "Write out and say verse 18. Optional: analyze the grammar of verse 18.",
    ],
  },
  {
    courseKey: "bible-46",
    day: "school",
    title: "Bible — School",
    body: ["Study Mark ch. 1 with map"],
  },
  {
    courseKey: "art-46",
    day: "school",
    title: "Art — fancy arrows",
    body: [
      "More work on the fancy arrows — symmetry, elements of shape, detail, clean page.",
      "Tuesday was our last class period on the fancy arrows.",
      "Next week: symmetry in butterflies and moths (Maria Merian).",
    ],
  },

  // —— 7–9 Math tracks ——
  {
    courseKey: "math-87",
    day: "school",
    title: "Math 8/7 — School (Lessons 5–6)",
    body: ["Math 8/7 Lessons 5–6"],
  },
  {
    courseKey: "math-87",
    day: "wednesday",
    title: "Math 8/7 — Wednesday",
    body: [
      "Lesson #5 lesson practice, Lesson #6 lesson practice (if not complete), and mixed practice.",
    ],
  },
  {
    courseKey: "math-87",
    day: "friday",
    title: "Math 8/7 — Friday",
    body: ["Lesson #7 lesson practice and mixed practice (evens)"],
  },
  {
    courseKey: "algebra-1",
    day: "school",
    title: "Algebra 1 — School (Lessons 6–9, Test 1)",
    body: [
      "Lessons 6–9, Test 1",
      "Time Assessment Tracking — take timed test and record time and score on graph.",
      "Lesson 6 – notes on rules for addition of signed numbers. Problem Set 6 — finish odds if needed.",
      "Lesson 7 — complete practice set and Problem set all. Check odds; mark incorrect with red pen.",
    ],
  },
  {
    courseKey: "algebra-1",
    day: "friday",
    title: "Algebra 1 — Friday",
    body: [
      "Take timed test and record time and score on graph. Make corrections to your test.",
      "Lesson 9 problem set all. Check odds; mark incorrect with red pen.",
    ],
  },
  {
    courseKey: "algebra-2",
    day: "school",
    title: "Algebra 2 — School (Lessons 5–8, Test 1)",
    body: [
      "Timed Assessment Tracking — take timed test; record time and score.",
      "Lesson 5 Problem Set — finish odds if needed.",
      "Lesson 6 Problem Set — complete all. Check odds; mark incorrect with red pen.",
    ],
  },
  {
    courseKey: "algebra-2",
    day: "friday",
    title: "Algebra 2 — Friday",
    body: [
      "Take timed test; record; make corrections.",
      "Make corrections to Lesson 6 Problem set evens.",
      "Lesson 8 problem set odds. Check odds; mark incorrect with red pen.",
    ],
  },

  // —— Grammar 7–8 / Omnibus / Science / Logic / Rhetoric / Greek / Music / Art ——
  {
    courseKey: "grammar-78",
    day: "school",
    title: "Grammar 7–8 — School",
    body: [
      "Our Mother Tongue — Lesson 3 on Adjectives (descriptive, limiting, and possessive).",
      "Consider various hymns and identify literary devices.",
    ],
  },
  {
    courseKey: "grammar-78",
    day: "wednesday",
    title: "Grammar 7–8 — Wednesday",
    body: [
      "Complete Exercises C, D, E, and F in Lesson 3.",
      "Memorize the first four lines of “Death, be not proud.”",
    ],
  },
  {
    courseKey: "grammar-78",
    day: "friday",
    title: "Grammar 7–8 — Friday",
    body: [
      "Keep working on “Death, be not proud.” Add at least two more lines.",
      "Spend time on “Hymns with 8.7.8.7.D Meter.” Notice who is spoken to and imagery/literary devices.",
      "Sing one of the given hymns with your family OR listen and identify imagery in another hymn.",
    ],
  },
  {
    courseKey: "omnibus",
    day: "school",
    title: "Omnibus — School (Gilgamesh & Ecclesiastes)",
    body: [
      "Complete the Epic of Gilgamesh and discuss major issues and themes.",
      "Compare the moral of the second half with Ecc. 3 and consider implications for the Christian worldview.",
    ],
  },
  {
    courseKey: "omnibus",
    day: "wednesday",
    title: "Omnibus — Wednesday (study guide)",
    body: [
      "Answer study guide questions in preparation for the assessment on Thursday.",
      "Know content and themes of Gen. 1–3, Epic of Creation, and Epic of Gilgamesh.",
    ],
  },
  {
    courseKey: "omnibus",
    day: "friday",
    title: "Omnibus — Test #1",
    body: [
      "Complete Omnibus Test #1 independently without the aid of resources other than the book.",
      "Students may use Bible, Epic of Creation, and Epic of Gilgamesh.",
    ],
  },
  {
    courseKey: "earth-science",
    day: "school",
    title: "Earth Science — School (Ch. 8)",
    body: [
      "Ask which questions came up on Friday.",
      "Earth Science, Ch. 8 — weathering, erosion, soils.",
      "Instruct on components and origin of soil within the geologic history of WI.",
    ],
  },
  {
    courseKey: "earth-science",
    day: "wednesday",
    title: "Earth Science — Wednesday (Ch. 8 exercises)",
    body: [
      "By the end of this week: In chapter 8 in Earth Science: God’s World, Our Home. Guide on p. 122.",
      "Complete the ch. 8 Exercises on p. 227, only # 1, 4, 6, 7, 8, 9, 13, 14, 15. Write in complete sentences.",
    ],
  },
  {
    courseKey: "earth-science",
    day: "friday",
    title: "Earth Science — Friday",
    body: [
      "See Wednesday.",
      "Analyze our soil and determine the type. Study composting and try it.",
    ],
  },
  {
    courseKey: "physical-science-9",
    day: "school",
    title: "Physical Science 9 — School (motion)",
    body: [
      "Explore: what causes changes in motion?",
      "Differentiate constant velocity and acceleration. Elevator illustration.",
      "Introduce motion equations and problem-solving strategies.",
    ],
  },
  {
    courseKey: "physical-science-9",
    day: "friday",
    title: "Physical Science 9 — Friday",
    body: ["Complete at least one of the motion problems sheets."],
  },
  {
    courseKey: "logic-1",
    day: "school",
    title: "Logic 1 — School",
    body: ["Review & Practice of Intro through lesson 3"],
  },
  {
    courseKey: "logic-1",
    day: "wednesday",
    title: "Logic 1 — Wednesday",
    body: [
      "pg. 41–43 Review Exercises for lesson 1 (1a–h and 2, 3, 4, and 5).",
    ],
  },
  {
    courseKey: "logic-1",
    day: "friday",
    title: "Logic 1 — Friday (stipulative definitions)",
    body: [
      "pg. 44–46 through the end of lesson 1 review exercises.",
      "Parents: help look up 3–4 words for question 9 on page 46 (graffiti, shadow ban, website, blog, umami, smartphone, etc.). Find when each entered the language.",
    ],
  },
  {
    courseKey: "logic-2",
    day: "school",
    title: "Logic 2 — School",
    body: ["Lesson #4, conditionals."],
  },
  {
    courseKey: "logic-2",
    day: "wednesday",
    title: "Logic 2 — Wednesday",
    body: ["Study for Test #1 next Tuesday."],
  },
  {
    courseKey: "rhetoric-9",
    day: "school",
    title: "Rhetoric — School",
    body: [
      "Compare paragraphs for persuasive features. Word choice and diction.",
      "Read Martin Luther’s speech at the Diet of Worms — what makes it great?",
    ],
  },
  {
    courseKey: "rhetoric-9",
    day: "wednesday",
    title: "Rhetoric — Wednesday",
    body: [
      "Finish annotating Luther’s speech. Identify Pathos, Ethos, and Logos passages (ideally three). Copy them down.",
    ],
  },
  {
    courseKey: "rhetoric-9",
    day: "friday",
    title: "Rhetoric — Friday",
    body: [
      "Finish reading Williamson’s “Christmas Truce” noting adjectives, metaphors, and word pictures.",
    ],
  },
  {
    courseKey: "greek-7",
    day: "school",
    title: "Greek 7 — School",
    body: [
      "Practice pronunciation and recitation. Begin reading short texts for understanding.",
    ],
  },
  {
    courseKey: "greek-7",
    day: "friday",
    title: "Greek 7 — Friday",
    body: [
      "Complete reading Chapter One of Logos (stop at ΓΡΑΜΜΑΤΙΚΗ). Listening to recordings and echoing.",
    ],
  },
  {
    courseKey: "greek-89",
    day: "school",
    title: "Greek 8–9 — School (Jonah)",
    body: [
      "Begin reading Jonah in Greek. Model an inductive, active method. Focus on pronunciation and understanding.",
    ],
  },
  {
    courseKey: "greek-89",
    day: "friday",
    title: "Greek 8–9 — Friday",
    body: [
      "Review Jonah 1:1–4 — chunking into phrases and practicing pronunciation.",
    ],
  },
  {
    courseKey: "music-7",
    day: "school",
    title: "Music 7 — School",
    body: [
      "Review eighth/sixteenth/quarter note rhythms and do pentatone from last year.",
      "Absolute pitch names (treble clef, F=do).",
      "Simple ostinato accompaniment; pitch for communal singing.",
    ],
  },
  {
    courseKey: "music-7",
    day: "wednesday",
    title: "Music 7 — Wednesday",
    body: [
      "333 Reading Exercises #36 — tuning fork as “mi”; walk down to low so for “Over the River.”",
      "Practice note names / do pentatone / F=do on the website.",
      "Perform “Brethren, We Have Met To Worship” on letter names and syllables.",
    ],
  },
  {
    courseKey: "music-7",
    day: "friday",
    title: "Music 7 — Friday",
    body: [
      "333 Reading Exercises #36.",
      "Sing “Over the River” with both class ostinati.",
      "Write out “Over the River” on the staff, G=do.",
    ],
  },
  {
    courseKey: "music-89",
    day: "wednesday",
    title: "Music 8–9 — Wednesday",
    body: [
      "Piano drone exercise (D above middle C) while singing l, d r m r d l,.",
      "Sing major scale with syllables and hand signs; then letter names in C, F, G major.",
      "See WhatsApp for sung examples from class (Genesis 2:19).",
    ],
  },
  {
    courseKey: "music-89",
    day: "friday",
    title: "Music 8–9 — Friday",
    body: [
      "Sing ascending & descending major scale (letter names or comfortable pitch on syllables).",
      "“Come Into His Presence” on letter names and syllables.",
      "Sing through the first 4 singing catechism questions.",
    ],
  },
  {
    courseKey: "art-79",
    day: "school",
    title: "Art 7–9 — School (Praying Hands prep)",
    body: [
      "Pure contour drawing of wrinkles on palm.",
      "Framing out and toning paper for use next week.",
      "Look at Albrecht Dürer’s “Praying Hands” and the Albertina notes on toned paper and highlights.",
    ],
  },
  {
    courseKey: "art-79",
    day: "friday",
    title: "Art 7–9 — Friday",
    body: ["If you didn’t get to Wednesday’s items, please do so today."],
  },
];
