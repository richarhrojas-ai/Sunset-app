#!/usr/bin/env python3
"""Genera una clave nueva para Sunset (16 caracteres, sin letras que se confundan)."""
import secrets

ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
key = "".join(secrets.choice(ALPHABET) for _ in range(16))
print("-".join(key[i:i + 4] for i in range(0, 16, 4)))
