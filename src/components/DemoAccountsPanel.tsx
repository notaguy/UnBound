import "./DemoAccountsPanel.css";

type DemoAccount = {
  email: string;
  password: string;
  label: string;
};

type Props = {
  onSelect: (email: string, password: string) => void;
};

export default function DemoAccountsPanel({ onSelect }: Props) {
  if (!import.meta.env.DEV) return null;

  const accounts: DemoAccount[] = [
    { email: "admin@mtucork.ie", password: "admin123", label: "Administrator MTU Cork" },
    { email: "alex@demo.ie", password: "demo123", label: "Persoană cu dizabilități" },
    { email: "student@mtucork.ie", password: "student123", label: "Student" },
  ];

  return (
    <div className="demo-accounts">
      <p className="demo-accounts__title">Conturi demo (doar local, npm run dev)</p>
      <ul>
        {accounts.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              className="demo-accounts__btn"
              onClick={() => onSelect(account.email, account.password)}
            >
              {account.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
