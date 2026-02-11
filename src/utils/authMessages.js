/**
 * Переводит сообщения об ошибках Supabase Auth на русский для показа пользователю.
 */
export function getAuthErrorMessage(error) {
  if (!error || !error.message) return 'Произошла ошибка. Попробуйте ещё раз.';
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  if (msg.includes('email not confirmed') || code.includes('email_not_confirmed')) {
    return 'Email не подтверждён. Перейдите по ссылке из письма от нас, затем войдите снова.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Неверный email или пароль. Проверьте данные или восстановите пароль.';
  }
  if (msg.includes('invalid') && msg.includes('password')) {
    return 'Неверный пароль. Проверьте ввод или воспользуйтесь восстановлением пароля.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Этот email уже зарегистрирован. Войдите или восстановите пароль.';
  }
  if (msg.includes('otp_expired') || msg.includes('expired') || msg.includes('invalid or has expired')) {
    return 'Ссылка недействительна или истекла. Запросите новое письмо (восстановление пароля или подтверждение).';
  }
  if (msg.includes('signup_disabled') || msg.includes('sign up disabled')) {
    return 'Регистрация временно отключена. Обратитесь в поддержку.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Нет соединения с интернетом. Проверьте сеть и попробуйте снова.';
  }
  if (msg.includes('duplicate') && msg.includes('key')) {
    return 'Такая запись уже есть. Обновите страницу или повторите действие позже.';
  }
  if (msg.includes('row-level security') || msg.includes('rls') || msg.includes('policy')) {
    return 'Нет доступа к данным. Войдите снова или обратитесь в поддержку.';
  }
  if (msg.includes('jwt') || msg.includes('session')) {
    return 'Сессия истекла. Войдите снова.';
  }

  return error.message;
}
