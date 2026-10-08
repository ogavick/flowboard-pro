import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTaskStore } from '../store/useTaskStore'
import TaskCard from './TaskCard'


function BoardColumn({ col, tasks, deleteTask }) {
  const { setNodeRef } = useDroppable({
    id: col.id,
  })

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-200 p-3 rounded-xl min-h-[200px] w-full"
    >
      <h2 className="font-bold mb-3">
        {col.title} ({tasks.length})
      </h2>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={deleteTask}
          />
        ))}
      </SortableContext>
    </div>
  )
}


export default function Board() {
  const {
    tasks,
    columns,
    loading,
    addTask,
    deleteTask,
    moveTask,
    fetchTasks,
    subscribeToTasks,
  } = useTaskStore()

  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')


  useEffect(() => {
    fetchTasks()

    const unsubscribe = subscribeToTasks()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [fetchTasks, subscribeToTasks])


  const handleDragEnd = ({ active, over }) => {
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Check if dropped directly onto a column
    const targetColumn = columns.find(
      (column) => column.id === overId
    )

    if (targetColumn) {
      moveTask(activeId, targetColumn.id)
      return
    }

    // Check if dropped onto another task
    const targetTask = tasks.find(
      (task) => task.id === overId
    )

    if (targetTask) {
      moveTask(activeId, targetTask.status)
    }
  }


  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-96 bg-gray-100 animate-pulse rounded-xl"
          />
        ))}
      </div>
    )
  }


  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-6xl mx-auto">

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="border p-2 rounded w-full mb-4"
          />


          {/* Add Task */}
          <div className="flex gap-2 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New task..."
              className="border p-2 rounded flex-1"
            />

            <button
              onClick={() => {
                if (title.trim()) {
                  addTask(title.trim())
                  setTitle('')
                }
              }}
              className="bg-black text-white px-4 rounded"
            >
              Add
            </button>
          </div>


          {/* Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => {

              const filteredTasks = tasks.filter(
                (task) =>
                  task.status === col.id &&
                  task.title
                    .toLowerCase()
                    .includes(search.toLowerCase())
              )

              return (
                <BoardColumn
                  key={col.id}
                  col={col}
                  tasks={filteredTasks}
                  deleteTask={deleteTask}
                />
              )
            })}
          </div>

        </div>
      </div>
    </DndContext>
  )
}