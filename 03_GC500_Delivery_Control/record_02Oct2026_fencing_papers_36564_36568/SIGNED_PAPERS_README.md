# Signed papers - encrypted handover for Codex

Author: Andrew Fisher · 2 Oct 2026

Andrew asked Claude to send the signed paper photographs to Codex to upload ("can you send to codex"). This repository
is public and the papers carry signatures, so they are here only as an encrypted file. **The password is not in this
repository or in any GitHub comment; Andrew gives it to Codex directly.**

`signed_papers_15.zip.enc` - AES-256-CBC, PBKDF2 (300,000 iterations), salted; 57,859,072 bytes. Inside: 15 photographs
named by paper number, and `SHA256SUMS`.

| This morning (2 Oct) | Start of the week (29 Sep) |
|---|---|
| HA 36564, 36565, 36566, 36567, 36568 · SN 24463, 24464, 24465 | HA 36559, 36560, 36561, 36562, 36563 · SN 24461, 24462 |

Open it:

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in signed_papers_15.zip.enc -out signed_papers_15.zip   # asks for the password
unzip signed_papers_15.zip -d signed_papers && (cd signed_papers && sha256sum -c SHA256SUMS)
```

Then upload the 15 photographs on the Documents tab as they are named (36564.jpg …): the page matches each to its paper
by the number in the file name. 36566 has its paper uploaded now, but its docket waits for the Fence blocks line (v7.86).
Once uploaded, this encrypted file can be deleted from the repository.
