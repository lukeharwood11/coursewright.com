# AGENTS — `infra/tfvars/`

Tier var files for the Terraform root in `../terraform/`. Not applied alone — always pass with `-var-file` from that module.

| File | Domain |
|------|--------|
| `testing.tfvars` | `justtesting.coursewright.com` |
| `production.tfvars` | `coursewright.com` |

```bash
cd ../terraform
terraform plan  -var-file=../tfvars/testing.tfvars
terraform apply -var-file=../tfvars/production.tfvars
```

Pair each file with the matching backend key (`backend-testing.hcl` / `backend-production.hcl`). Do not commit secrets here.
