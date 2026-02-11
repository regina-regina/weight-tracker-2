# Страница подтверждения почты

Файл `email-confirmed.html` показывается после перехода по ссылке из письма Supabase.

Настройка в Supabase:
1. Authentication → URL Configuration.
2. Site URL: укажи адрес, по которому открывается этот файл (например https://твой-сайт.ru/email-confirmed.html).
3. Redirect URLs: добавь тот же URL.

Как раздать файл:
- Залей папку `public` на любой хостинг (GitHub Pages, Vercel, Netlify и т.д.) и укажи в Supabase полный URL до email-confirmed.html.
- Либо собери веб-версию приложения (expo start --web) и положи этот HTML в корень статики, затем укажи в Supabase URL этой страницы.

Лимит времени ссылки подтверждения: в облачном Supabase через дашборд не настраивается (по умолчанию ссылка действует ограниченное время). Увеличить или отключить срок можно только при self-hosted GoTrue через переменные окружения (документация Supabase Self-Hosting Auth).
