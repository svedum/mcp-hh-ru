# `@svedum/mcp-hh-ru`

MCP-сервер для [hh.ru](https://hh.ru): поиск вакансий, свои резюме и отклики
**соискателя**. Работает по stdio — в Сведуме, Cursor, Claude Desktop и любом
MCP-клиенте. Кабинет работодателя в этой версии не входит (вернём после
OAuth-приложения).

## Установка

```bash
npx -y @svedum/mcp-hh-ru@0.2.0
```

### Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "hh-ru": {
      "command": "npx",
      "args": ["-y", "@svedum/mcp-hh-ru@0.2.0"],
      "env": {
        "HH_UA_EMAIL": "you@example.com"
      }
    }
  }
}
```

Поиск вакансий, справочники и карточки работают **без токена**. Свои резюме,
отклики и `/me` — с `HH_TOKEN` (OAuth access token пользователя).

Токен (опционально): приложение на [dev.hh.ru/admin](https://dev.hh.ru/admin) →
OAuth authorization code → `access_token`. В env: `HH_TOKEN` и
`HH_UA_EMAIL` (или полный `HH_USER_AGENT`).

`HH-User-Agent` обязателен у hh.ru: задайте `HH_USER_AGENT` целиком или
контактный `HH_UA_EMAIL` (без дефолта — один из двух обязателен).

## Инструменты

| Инструмент | Токен | Кто |
|------------|:-----:|-----|
| `search_vacancies` | нет* | все |
| `get_vacancy` | нет* | все |
| `get_similar_vacancies` | нет* | все |
| `get_employer` | нет* | все (карточка компании) |
| `get_areas` | нет | все |
| `get_dictionaries` | нет | все |
| `get_professional_roles` | нет | все |
| `get_me` | да | соискатель |
| `list_mine_resumes` | да | соискатель |
| `get_resume` | да | соискатель |
| `list_negotiations` | да | соискатель |
| `get_negotiation` | да | соискатель |

\* без токена — публичная выдача; с токеном hh может персонализировать.

## [Сведум](https://svedum.ru/dev)

Плагин каталога `hh-ru` запускает этот пакет через npm-раннер приложения.
Публичный поиск работает без входа; личные резюме и отклики — когда появится
OAuth приложения или через `HH_TOKEN` во внешних клиентах.

## Разработка

```bash
npm install
npm run build
npm start
```

## Лицензия

MIT
