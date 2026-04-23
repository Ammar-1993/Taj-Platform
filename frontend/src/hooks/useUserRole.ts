import { useAuth } from '@/context/AuthContext';

export function useUserRole() {
    const { user } = useAuth();
    
    const isTeacher = user?.roles?.some(r => r.name === 'teacher') ?? false;
    const isParent = user?.roles?.some(r => r.name === 'parent') ?? false;
    const isStudent = user?.roles?.some(r => r.name === 'student') ?? false;
    const isAdmin = user?.roles?.some(r => r.name === 'admin') ?? false;
    
    return { isTeacher, isParent, isStudent, isAdmin };
}
