# Triage Labels

Skills berbicara dalam lima canonical triage roles. File ini memetakan roles tersebut ke string label
yang dipakai di issue tracker repo ini.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer perlu mengevaluasi issue ini   |
| `needs-info`               | `needs-info`         | Menunggu info tambahan dari reporter      |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, siap dikerjakan agent    |
| `ready-for-human`          | `ready-for-human`    | Butuh implementasi manusia                |
| `wontfix`                  | `wontfix`            | Tidak akan dikerjakan                     |

Untuk file `.scratch/`, baris `Status:` di tiap issue memakai salah satu string di atas. Edit kolom kanan
jika ingin memakai vocabulary lain (misal map ke field JIRA, catat nama field-nya di `issue-tracker.md`).
