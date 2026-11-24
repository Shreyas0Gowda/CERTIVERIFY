/**
 * Calculates SHA-256 hash of a File or Blob directly from its raw bytes
 * using the standard browser Web Crypto API.
 * @param {File|Blob} file
 * @returns {Promise<string>} 64-character lowercase hex SHA-256 hash
 */
export async function calculateFileSHA256(file) {
  if (!file) {
    throw new Error("No file provided for hashing");
  }

  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return hashHex.toLowerCase();
}

/**
 * Truncates an Ethereum address or hash for UI display (e.g., 0x1234...abcd)
 */
export function truncateHash(hash, frontChars = 8, backChars = 6) {
  if (!hash) return "";
  if (hash.length <= frontChars + backChars + 3) return hash;
  return `${hash.slice(0, frontChars)}...${hash.slice(-backChars)}`;
}

/**
 * Copies text to user clipboard
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

