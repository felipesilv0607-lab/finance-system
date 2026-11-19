// Regras de senha do cadastro. Precisam acompanhar a política do backend
// (backend/src/utils/userValidation.js), que é quem decide; o frontend só
// antecipa o erro na validação nativa do navegador.
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
