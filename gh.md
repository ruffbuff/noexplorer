# Git Шпаргалка для Noexplorer

## Основные команды для ежедневной работы

### Проверить состояние

```bash
git status                    # Что изменилось
git branch -v                 # Все ветки + их статус
git log --oneline -5          # Последние 5 коммитов
```

### Работа с ветками

```bash
git checkout dev              # Переключиться на dev
git checkout main             # Переключиться на main
git checkout -b feature-name  # Создать новую ветку и переключиться
```

### Коммиты

```bash
git add .                     # Добавить все изменения
git commit -m "фикс: описание"  # Закоммитить с сообщением
git push origin dev           # Отправить на GitHub в dev ветку
```

### Синхронизация с GitHub

```bash
git pull origin main          # Скачать изменения из main с GitHub
git pull origin dev           # Скачать изменения из dev с GitHub
git push origin main          # Отправить main на GitHub
git push origin dev           # Отправить dev на GitHub
```

## Рабочий процесс для Noexplorer

### 1. Начало работы (каждый день)

```bash
git checkout dev              # Переключиться на dev
git pull origin dev           # Скачать последние изменения
git status                    # Проверить что всё чисто
```

### 2. Разработка фичи

```bash
# Работаешь в коде...
git add .                     # Добавить изменения
git commit -m ":sparkles: новая фича"  # Коммит
git push origin dev           # Отправить на GitHub
```

### 3. Готов к релизу (слить dev → main)

```bash
git checkout main             # Переключиться на main
git pull origin main          # Обновить main с GitHub
git merge dev                 # Влить dev в main
git push origin main          # Отправить обновлённый main
```

### 4. Обновить версию (опционально)

```bash
# Отредактируй package.json - увеличь версию
git add package.json
git commit -m ":bug: fix v0.1.6"
git push origin main
```

## Проблемы и решения

### Ветка отстаёт от GitHub

```bash
git pull origin main          # Скачать изменения
# Если есть конфликты - разреши их, потом:
git add .
git commit -m "merge"
```

### Забыл на какой ветке работаю

```bash
git branch                    # Покажет текущую ветку (*)
git status                    # Покажет изменения
```

### Хочу отменить последний коммит

```bash
git reset --soft HEAD~1       # Отменить коммит, оставить изменения
git reset --hard HEAD~1       # Отменить коммит И изменения (осторожно!)
```

### Случайно коммитнул в wrong ветку

```bash
git log --oneline -3          # Найди хеш нужного коммита
git checkout правильная-ветка # Переключись на правильную ветку
git cherry-pick ХЕША-КОММИТА  # Перенеси коммит
```

## Типичные сообщения коммитов

```bash
git commit -m ":sparkles: добавил новую фичу"
git commit -m ":bug: исправил баг с поиском"
git commit -m ":lipstick: улучшил UI компонента"
git commit -m ":recycle: рефакторинг API"
git commit -m ":rocket: оптимизация производительности"
git commit -m ":wrench: обновил конфигурацию"
git commit -m ":memo: обновил документацию"
```

## Структура веток для Noexplorer

```
main ← production (деплой на Vercel)
 ↑
dev ← разработка (основная ветка для работы)
 ↑
feature-* ← отдельные фичи (если нужно)
```

## Быстрые команды для частых ситуаций

### Быстрый фикс и деплой

```bash
# На dev ветке:
git add . && git commit -m ":bug: фикс" && git push origin dev
git checkout main && git pull origin main && git merge dev && git push origin main
git checkout dev  # Вернуться на dev для работы
```

### Проверить что изменилось между ветками

```bash
git diff main..dev --name-only     # Какие файлы отличаются
git diff main..dev                 # Все изменения
git log main..dev --oneline        # Какие коммиты добавились в dev
```

### Экстренный откат в production

```bash
git checkout main
git log --oneline -10               # Найди хороший коммит
git reset --hard ХЕША-ХОРОШЕГО-КОММИТА
git push origin main --force       # ОСТОРОЖНО! Только в экстренных случаях
```

## Важные заметки

- **dev** - основная ветка для разработки
- **main** - только стабильные версии для деплоя
- Всегда делай `git pull` перед началом работы
- Всегда проверяй `git status` перед коммитом
- В production никогда не используй `--force` без крайней необходимости
- Версии в package.json увеличивай при каждом релизе
