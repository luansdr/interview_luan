import { onlyDigits } from "./onlyDigits.utils";

export const isCpf11 = (cpf: string) => onlyDigits(cpf).length === 11;
