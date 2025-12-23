import { supabase } from './useSupabase'
import { useAuth } from './useSupabase'

export function usePayments() {
  const { user } = useAuth()

  const createPayment = async (payload) => {
    const { data } = await supabase
      .from('payments')
      .insert({
        user_id: user.value.id,
        ...payload,
        status: 'initiated'
      })
      .select()
      .single()

    return data
  }

  const updatePaymentStatus = async (id, status, extra = {}) => {
  const { error } = await supabase
    .from('payments')
    .update({
      status,
      ...extra
    })
    .eq('id', id)

  if (error) throw error
}

  return {
    createPayment,
    updatePaymentStatus
  }
}
