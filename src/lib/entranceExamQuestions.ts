export interface ExamQuestion {
  id: number;
  subject: 'Mathematics' | 'English Language' | 'General Knowledge';
  question: string;
  options: string[];
  correctAnswer: number; // index 0-3
  explanation?: string;
}

export const juniorEntranceQuestions: ExamQuestion[] = [
  {
    id: 1,
    subject: 'English Language',
    question: 'Choose the option that best completes the sentence: The principal, together with the teachers, _______ present at the assembly.',
    options: ['are', 'is', 'were', 'have been'],
    correctAnswer: 1,
    explanation: 'Subject-verb agreement: when joined by "together with", the verb agrees with the singular subject "The principal".',
  },
  {
    id: 2,
    subject: 'English Language',
    question: 'Identify the antonym of the word "DILIGENT":',
    options: ['Hardworking', 'Indolent', 'Careful', 'Ambitious'],
    correctAnswer: 1,
    explanation: '"Indolent" means lazy, which is the opposite of diligent.',
  },
  {
    id: 3,
    subject: 'English Language',
    question: 'Which of the following is a collective noun?',
    options: ['Water', 'Flock', 'Bravery', 'Quickly'],
    correctAnswer: 1,
    explanation: '"Flock" denotes a group of birds or sheep.',
  },
  {
    id: 4,
    subject: 'Mathematics',
    question: 'Find the value of x if 3x + 15 = 45.',
    options: ['5', '10', '15', '20'],
    correctAnswer: 1,
    explanation: '3x = 45 - 15 = 30 => x = 10.',
  },
  {
    id: 5,
    subject: 'Mathematics',
    question: 'What is the Lowest Common Multiple (L.C.M.) of 12, 18, and 24?',
    options: ['36', '48', '72', '144'],
    correctAnswer: 2,
    explanation: 'The prime factorizations give 2^3 * 3^2 = 8 * 9 = 72.',
  },
  {
    id: 6,
    subject: 'Mathematics',
    question: 'A trader buys an item for ₦4,000 and sells it for ₦5,000. Calculate the percentage profit.',
    options: ['20%', '25%', '30%', '15%'],
    correctAnswer: 1,
    explanation: 'Profit = ₦1,000. Percentage profit = (1000/4000) * 100% = 25%.',
  },
  {
    id: 7,
    subject: 'General Knowledge',
    question: 'What is the primary gas found in the Earth\'s atmosphere?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
    correctAnswer: 2,
    explanation: 'Nitrogen makes up approximately 78% of Earth\'s atmosphere.',
  },
  {
    id: 8,
    subject: 'General Knowledge',
    question: 'Which organ of the human body is responsible for pumping blood throughout the circulatory system?',
    options: ['Lungs', 'Liver', 'Heart', 'Kidney'],
    correctAnswer: 2,
    explanation: 'The heart acts as the muscular pump for the circulatory system.',
  },
  {
    id: 9,
    subject: 'Mathematics',
    question: 'Calculate the perimeter of a rectangle whose length is 14 cm and width is 8 cm.',
    options: ['44 cm', '22 cm', '112 cm', '56 cm'],
    correctAnswer: 0,
    explanation: 'Perimeter = 2 * (length + width) = 2 * (14 + 8) = 44 cm.',
  },
  {
    id: 10,
    subject: 'General Knowledge',
    question: 'What is the chemical symbol for water?',
    options: ['CO2', 'NaCl', 'H2O', 'O2'],
    correctAnswer: 2,
    explanation: 'Water consists of two hydrogen atoms and one oxygen atom: H2O.',
  },
];
