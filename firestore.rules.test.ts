// Phase 0 Adversarial Test Runner verifying the "Dirty Dozen" payloads against firestore.rules.
// Intended to run against the Firebase Emulator Suite (`@firebase/rules-unit-testing`).
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";

async function runDirtyDozenChecks() {
  const testEnv = await initializeTestEnvironment({
    projectId: "spark-security-audit",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });

  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const userADb = testEnv.authenticatedContext("userA", { email_verified: true }).firestore();
  const userBDb = testEnv.authenticatedContext("userB", { email_verified: true }).firestore();
  const unverifiedDb = testEnv.authenticatedContext("userC", { email_verified: false }).firestore();

  // 1. Unauthenticated Profile Read
  await assertFails(getDoc(doc(unauthDb, "profiles", "userA")));
  // 2. Cross-User Profile Read
  await assertFails(getDoc(doc(userBDb, "profiles", "userA")));
  // 3. Shadow Field on Profile Create
  await assertFails(setDoc(doc(userADb, "profiles", "userA"), {
    id: "userA", username: "a", full_name: "", division: "", batch: "", year: "",
    date_of_birth: "", college: "", phone: "", created_at: serverTimestamp(), updated_at: serverTimestamp(),
    isAdmin: true,
  }));
  // 4. Profile created_at tampering on update
  await assertFails(updateDoc(doc(userADb, "profiles", "userA"), { created_at: new Date(0) }));
  // 5. Unverified email spoof
  await assertFails(setDoc(doc(unverifiedDb, "profiles", "userC"), {
    id: "userC", username: "c", full_name: "", division: "", batch: "", year: "",
    date_of_birth: "", college: "", phone: "", created_at: serverTimestamp(), updated_at: serverTimestamp(),
  }));
  // 6. Cross-user event registration
  await assertFails(setDoc(doc(userBDb, "event_registrations", "userA_open-mic-night"), {
    id: "userA_open-mic-night", user_id: "userA", event_id: "open-mic-night",
    student_details: { full_name: "A", division: "Comp", batch: "2024", year: "2nd Year", date_of_birth: "2005-01-01", college: "PIT", phone: "+91 9876543210", terms: true },
    created_at: serverTimestamp(),
  }));
  // 7. Invalid event_id
  await assertFails(setDoc(doc(userADb, "event_registrations", "userA_fake-event"), {
    id: "userA_fake-event", user_id: "userA", event_id: "fake-event",
    student_details: { full_name: "A", division: "Comp", batch: "2024", year: "2nd Year", date_of_birth: "2005-01-01", college: "PIT", phone: "+91 9876543210", terms: true },
    created_at: serverTimestamp(),
  }));
  // 8. Terms false
  await assertFails(setDoc(doc(userADb, "event_registrations", "userA_open-mic-night"), {
    id: "userA_open-mic-night", user_id: "userA", event_id: "open-mic-night",
    student_details: { full_name: "A", division: "Comp", batch: "2024", year: "2nd Year", date_of_birth: "2005-01-01", college: "PIT", phone: "+91 9876543210", terms: false },
    created_at: serverTimestamp(),
  }));
  // 9. Club count inflation without membership
  await assertFails(updateDoc(doc(userADb, "clubs", "dance"), { member_count: 999 }));
  // 10. Duplicate club join inflation (no membership created in same batch)
  await assertFails(updateDoc(doc(userADb, "clubs", "dance"), { member_count: 2 }));
  // 11. Arbitrary club creation
  await assertFails(setDoc(doc(userADb, "clubs", "hacked-club"), { id: "hacked-club", name: "Hacked", member_count: 500 }));
  // 12. Blanket list query on club_suggestions
  await assertFails(getDocs(collection(userBDb, "club_suggestions")));

  await testEnv.cleanup();
}

export { runDirtyDozenChecks };
