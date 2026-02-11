# PWA-версия приложения и деплой на GitHub Pages

Приложение можно открывать в браузере как веб-приложение (PWA) без Apple Developer и TestFlight. После деплоя на GitHub Pages пользователи смогут открыть ссылку в Safari/Chrome и при желании добавить иконку на главный экран.

---

## Что уже сделано в проекте

- В app.json добавлены настройки веб/PWA (themeColor, backgroundColor, display: standalone) и baseUrl для подпапки GitHub Pages (/weight-tracker).
- В public/manifest.json описан манифест PWA (название, иконки, start_url).
- В package.json добавлены скрипты build:web, predeploy и deploy, а также зависимость gh-pages.

---

## Шаг 1. Зависимости для веб-сборки

Для экспорта под веб нужны react-dom и react-native-web. Установи их через Expo:

  npx expo install react-dom react-native-web

Установи dev-зависимости (в т.ч. gh-pages), если ещё не ставил:

  npm install

---

## Шаг 2. Иконки для PWA

Манифест ожидает в папке public файлы:

  - logo192.png (192×192 px)
  - logo512.png (512×512 px)

Если в проекте уже есть assets/icon.png или assets/favicon.png, сделай из них две версии 192 и 512 px и положи в public/ с именами logo192.png и logo512.png. Можно использовать любой редактор или онлайновый ресайзер.

Без этих файлов PWA будет работать, но при «Установить на главный экран» иконка может подставляться по умолчанию.

---

## Шаг 3. Подключение манифеста в HTML

Expo при экспорте генерирует index.html. Чтобы в него попала ссылка на манифест PWA, нужно один раз создать кастомный шаблон:

  npx expo customize public/index.html

В списке выбери public/index.html (или web/index.html, если так предложит). В созданном файле в секцию <head> добавь строку:

  <link rel="manifest" href="/weight-tracker/manifest.json" />

Сохрани файл. Если репозиторий будет называться иначе (не weight-tracker), замени в href путь на /ИМЯ-РЕПО/manifest.json.

---

## Шаг 4. Проверка сборки локально

Собери веб-версию:

  npm run build:web

В корне проекта появится папка dist с статическими файлами. Проверить можно так:

  npx serve dist

Открой в браузере выданный адрес (часто http://localhost:3000). Для проверки с путём как на GitHub Pages открой http://localhost:3000/weight-tracker/ (если serve отдаёт по этому пути).

---

## Шаг 5. Деплой на GitHub Pages

1. Репозиторий на GitHub должен существовать и быть привязан к проекту (git remote origin).

2. Имя репозитория и baseUrl должны совпадать. Сейчас в app.json указано experiments.baseUrl: "/weight-tracker". Если репозиторий называется иначе (например, my-weight-app), измени в app.json на "/my-weight-app" и в manifest.json в start_url на "/my-weight-app/", а в public/index.html в href манифеста на "/my-weight-app/manifest.json".

3. Выполни деплой:

  npm run deploy

Скрипт сначала соберёт веб (expo export --platform web), скопирует index.html в 404.html (чтобы при прямых переходах по путям GitHub Pages отдавал приложение, а не 404), затем опубликует содержимое папки dist в ветку gh-pages через gh-pages.

4. Включи GitHub Pages в настройках репозитория:
   - GitHub → репозиторий → Settings → Pages.
   - Source: Deploy from a branch.
   - Branch: gh-pages, папка: / (root).
   - Save.

Через 1–2 минуты приложение будет доступно по адресу:

  https://ТВОЙ-USERNAME.github.io/weight-tracker/

(замени ТВОЙ-USERNAME на свой логин GitHub и weight-tracker на имя репо, если менял.)

---

## Шаг 6. Как пользоваться PWA

- Открыть ссылку в Safari (iOS) или Chrome (Android/десктоп).
- Войти в приложение как обычно.
- В Safari: «Поделиться» → «На экран Домой» — иконка появится на главном экране и будет открываться в полноэкранном режиме (standalone).
- В Chrome (Android/десктоп): меню → «Установить приложение» / «Add to Home screen» при поддержке.

---

## Важно

- Переменные окружения (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY) при сборке берутся из .env в корне проекта. Для деплоя с твоей машины убедись, что .env заполнен; в CI (если будешь деплой через Actions) их нужно задать в секретах.
- Если используешь подтверждение email через Supabase и редирект обратно в приложение, для веба может понадобиться включить в коде detectSessionInUrl: true в настройках Supabase auth (в src/services/supabase.js), чтобы сессия подхватывалась из URL после перехода по ссылке из письма.

---

## Обновление PWA после изменений

После правок в коде снова выполни:

  npm run deploy

Ветка gh-pages обновится, и через пару минут на сайте будет новая версия.
