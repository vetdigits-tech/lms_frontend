'use client';

import { useParams } from 'next/navigation';
import QuizResults from '../../../../../components/quiz/QuizResults';

export default function QuizResultsPage() {
    const params = useParams();
    const attemptId = params.attemptid; // 🔧 Fixed: Use 'attemptid' (lowercase)

    return <QuizResults attemptId={attemptId} />;
}
