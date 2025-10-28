# 🩺 Sistema de Receituário Digital — API CSV

API desenvolvida em **NestJS** para processar arquivos **CSV de prescrições médicas**, validando dados, armazenando resultados em memória e permitindo acompanhamento do status de processamento.

---

## 🚀 Tecnologias

* **Node.js 20+**
* **NestJS**
* **TypeScript**
---

## 📦 Instalação

```bash
git clone https://github.com/luansdr/interview_luan.git
cd interview_luan
npm install
npm run start:dev
```

A aplicação roda por padrão em
👉 `http://localhost:3000/api`

---

## 🧩 Estrutura

```
📦interview_mevo_luan
 ┣ 📂src
 ┃ ┣ 📂common
 ┃ ┃ ┣ 📂constants
 ┃ ┃ ┃ ┗ 📜ufs.ts
 ┃ ┃ ┗ 📂utils
 ┃ ┃ ┃ ┣ 📜isCPF.utils.ts
 ┃ ┃ ┃ ┣ 📜onlyDigits.utils.ts
 ┃ ┃ ┃ ┣ 📜parseBool.utils.ts
 ┃ ┃ ┃ ┣ 📜parseFreqHours.utils.ts
 ┃ ┃ ┃ ┗ 📜todayISO.utils.ts
 ┃ ┣ 📂health
 ┃ ┃ ┣ 📜health.controller.ts
 ┃ ┃ ┗ 📜health.module.ts
 ┃ ┣ 📂interceptors
 ┃ ┃ ┗ 📂audit
 ┃ ┃ ┃ ┗ 📜audit.interceptor.ts
 ┃ ┣ 📂prescriptions
 ┃ ┃ ┣ 📂dto
 ┃ ┃ ┣ 📂entities
 ┃ ┃ ┃ ┗ 📜prescription.entity.ts
 ┃ ┃ ┣ 📂interfaces
 ┃ ┃ ┃ ┣ 📜IErrorPrescription.interface.ts
 ┃ ┃ ┃ ┗ 📜IStatusPayload.interface.ts
 ┃ ┃ ┣ 📂types
 ┃ ┃ ┃ ┗ 📜TUploadStatus.type.ts
 ┃ ┃ ┣ 📜.DS_Store
 ┃ ┃ ┣ 📜prescriptions.controller.ts
 ┃ ┃ ┣ 📜prescriptions.module.ts
 ┃ ┃ ┗ 📜prescriptions.service.ts
 ┃ ┣ 📂services
 ┃ ┃ ┗ 📜file-service.service.ts
 ┃ ┣ 📜app.controller.ts
 ┃ ┣ 📜app.module.ts
 ┃ ┣ 📜app.service.ts
 ┃ ┗ 📜main.ts
 ┣ 📂test
 ┃ ┣ 📜app.e2e-spec.ts
 ┃ ┗ 📜jest-e2e.json
 ┣ 📜.dockerignore
 ┣ 📜.gcloudignore
 ┣ 📜.gitignore
 ┣ 📜.prettierrc
 ┣ 📜Dockerfile
 ┣ 📜README.md
 ┣ 📜Teste para Desenvolvedor Back End Sênior.pdf
 ┣ 📜data.db
 ┣ 📜eslint.config.mjs
 ┣ 📜nest-cli.json
 ┣ 📜package-lock.json
 ┣ 📜package.json
 ┣ 📜prescricoes.csv
 ┣ 📜prescricoes_quebrado.csv
 ┣ 📜tsconfig.build.json
 ┗ 📜tsconfig.json
```

---

## 📄 Estrutura esperada do CSV

```csv
id,date,patient_cpf,doctor_crm,doctor_uf,medication,controlled,dosage,frequency,duration,notes
RX001,2024-01-15,12345678901,123456,SP,Dipirona,false,500mg,8/8h,7,Tomar após as refeições
RX002,2024-01-16,98765432109,789012,RJ,Amoxicilina,false,875mg,12/12h,10,
RX003,2024-01-17,11122233344,123456,SP,Lorazepam,true,1mg,12/12h,30,1cp as 7h e as 19h
```

---

## ✅ Regras de Validação

**Campos obrigatórios**

* `id`: único no sistema
* `date`: formato válido e não futura
* `patient_cpf`: 11 dígitos válidos
* `doctor_crm`: numérico
* `doctor_uf`: UF válida (2 letras)
* `medication`: obrigatório
* `controlled`: boolean (vazio = false)
* `dosage`: obrigatório
* `duration`: numérico positivo
* `frequency`: número positivo ou “Se necessário”




### POST `/api/prescriptions/upload`

Upload de arquivo CSV e início do processamento assíncrono.

**Request**
`multipart/form-data` → campo: `file`

**Response**

```json
{
  "upload_id": "uuid",
  "status": "processing",
  "total_records": 0,
  "processed_records": 0,
  "valid_records": 0,
  "errors": []
}
```

---

### GET `/api/prescriptions/upload/:id`

Consulta status de um upload.

**Response**

```json
{
  "upload_id": "uuid",
  "status": "completed",
  "total_records": 150,
  "processed_records": 150,
  "valid_records": 145,
  "errors": [
    {
      "line": 5,
      "field": "patient_cpf",
      "message": "CPF inválido",
      "value": "12345ABC900"
    }
  ]
}
```

---

## 🧾 Logs de Auditoria

* Cada upload gera logs com:

  * `upload_id`, `tamanho`, `tempo de execução`, `contagem de erros`, `status final`
* Logs ficam no stdout (console):

  ```
  [Nest] 3452  - Upload iniciado upload=5a4c… size=12KB
  [Nest] 3452  - upload=5a4c… completed total=120 valid=118 errors=2 time=32ms
  ```

---

## 🧱 Tratamento de Erros

| Cenário                      | Retorno                                     |
| ---------------------------- | ------------------------------------------- |
| Arquivo corrompido           | `CSV inválido/corrompido`                   |
| Arquivo vazio                | `Arquivo vazio`                             |
| Cabeçalho ausente/incorreto  | `Cabeçalho inválido`                        |
| Tipo errado (não CSV)        | `Tipo de arquivo inválido`                  |
| Excesso de erros             | Upload marcado como `failed` após 200 erros |
| Exceção inesperada por linha | Registrada em `errors[]` e mantida no log   |

---

## 🧪 Testes rápidos com curl

```bash
curl -X POST http://localhost:3000/api/prescriptions/upload \
  -F "file=@/prescricoes.csv"
```

```bash
curl http://localhost:3000/api/prescriptions/upload/<upload_id>
```

---

## 👨‍⚕️ Autor

**Luan Reis**
Desenvolvedor Full-Stack

📧 contato: `luanssrr@outlook.com`

💼 [LinkedIn](http://www.linkedin.com/in/luan-reis-590620203)

---