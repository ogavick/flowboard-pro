import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTaskStore = create((set, get) => ({
  tasks: [],

  columns: [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ],

  loading: true,


  // FETCH TASKS
  fetchTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      set({ loading: false })
      return
    }

    set({
      tasks: data || [],
      loading: false,
    })
  },


  // ADD TASK
  addTask: async (title) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title,
      status: 'todo',
      priority: 'medium',
    }

    // Optimistic UI
    set({
      tasks: [...get().tasks, newTask],
    })

    const { error } = await supabase
      .from('tasks')
      .insert(newTask)

    if (error) {
      console.error('Error adding task:', error)

      // Remove optimistic task if database insert failed
      set({
        tasks: get().tasks.filter(
          (task) => task.id !== newTask.id
        ),
      })
    }
  },


  // DELETE TASK
  deleteTask: async (id) => {
    const previousTasks = get().tasks

    // Optimistic UI
    set({
      tasks: previousTasks.filter(
        (task) => task.id !== id
      ),
    })

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)

      // Restore task if deletion failed
      set({
        tasks: previousTasks,
      })
    }
  },


  // MOVE TASK
  moveTask: async (taskId, newStatus) => {
    const previousTasks = get().tasks

    // Optimistic UI
    set({
      tasks: previousTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      ),
    })

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Error moving task:', error)

      // Restore previous state
      set({
        tasks: previousTasks,
      })
    }
  },


  // REALTIME
  subscribeToTasks: () => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {

          // INSERT
          if (payload.eventType === 'INSERT') {
            const exists = get().tasks.some(
              (task) => task.id === payload.new.id
            )

            if (!exists) {
              set({
                tasks: [
                  ...get().tasks,
                  payload.new,
                ],
              })
            }
          }


          // UPDATE
          if (payload.eventType === 'UPDATE') {
            set({
              tasks: get().tasks.map((task) =>
                task.id === payload.new.id
                  ? payload.new
                  : task
              ),
            })
          }


          // DELETE
          if (payload.eventType === 'DELETE') {
            set({
              tasks: get().tasks.filter(
                (task) => task.id !== payload.old.id
              ),
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))