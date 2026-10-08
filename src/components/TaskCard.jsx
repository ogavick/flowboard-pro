import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function TaskCard({ task, onDelete }) {
  const priorityColor = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
}[task.priority] || 'bg-gray-100'
 const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

 const style = {
 transform: CSS.Transform.toString(transform),
 transition,
 }

 return (
 <div ref={setNodeRef} style={style} {...attributes} {...listeners}
 className="bg-white p-3 rounded-lg shadow mb-3 cursor-grab active:cursor-grabbing">
 <p className="font-medium">{task.title}</p>
 <div className="flex justify-between mt-2 text-xs items-center">
 <span className="bg-blue-100 px-2 py-1 rounded">{task.priority}</span>
 {/* FIX: stopPropagation so click doesn't start drag */}
 <button
 onPointerDown={(e) => e.stopPropagation()}
 onClick={() => onDelete(task.id)}
 className="text-red-500 hover:text-red-700 font-bold z-10 relative px-2 py-1"
 >
 Delete
 </button>
 </div>
 </div>
 )
}