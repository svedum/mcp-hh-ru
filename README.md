# `@svedum/mcp-hh-ru`

MCP-сервер для [hh.ru](https://hh.ru): поиск вакансий, свои резюме, отклики
(соискатель и работодатель). Работает по stdio — в Сведуме, Cursor, Claude Desktop
и любом MCP-клиенте.

## Установка

```bash
npx -y @svedum/mcp-hh-ru@0.1.1
```

### Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "hh-ru": {
      "command": "npx",
      "args": ["-y", "@svedum/mcp-hh-ru@0.1.1"],
      "env": {
        "HH_TOKEN": "your-oauth-access-token",
        "HH_UA_EMAIL": "you@example.com"
      }
    }
  }
}
```

Поиск вакансий, справочники и карточки работают **без токена**. Свои резюме,
отклики, `/me` и кабинет работодателя — только с токеном пользователя.

Токен: приложение на [dev.hh.ru/admin](https://dev.hh.ru/admin) → OAuth
authorization code → `access_token`. В [Сведуме](https://svedum.ru/dev) вход
через OAuth приложения продукта (платформа хранит секрет, на компьютер уходит
только access token).

`HH-User-Agent` обязателен у hh.ru: задайте `HH_USER_AGENT` целиком или
контактный `HH_UA_EMAIL` (без дефолта — один из двух обязателен).

## Инструменты

| Инструмент | Токен | Кто |
|------------|:-----:|-----|
| `search_vacancies` | нет* | все |
| `get_vacancy` | нет* | все |
| `get_similar_vacancies` | нет* | все |
| `get_employer` | нет* | все |
| `get_areas` | нет | все |
| `get_dictionaries` | нет | все |
| `get_professional_roles` | нет | все |
| `get_me` | да | соискатель / менеджер |
| `list_mine_resumes` | да | соискатель |
| `get_resume` | да | соискатель / работодатель |
| `list_negotiations` | да | оба |
| `get_negotiation` | да | оба |
| `list_employer_vacancies` | да | работодатель |
| `search_resumes` | да | работодатель (база резюме) |

\* без токена — публичная выдача; с токеном hh может персонализировать.

## [Сведум](https://svedum.ru/dev)

Плагин каталога `hh-ru` запускает этот пакет через npm-раннер приложения
и входит через OAuth (`clientRef: hh-ru`). Для внешних клиентов
достаточно `HH_TOKEN` в env.

## Разработка

```bash
npm install
npm run build
npm start
```

## Лицензия

MIT
