import React from 'react'

interface User {
    id: number;
    name: string;
    email: string;
}

export default async function Users() {
    const res = await fetch('https://jsonplaceholder.typicode.com/users', {
        next: {revalidate: 10}, // revalidate every 60 seconds
    });
    const users: User[] = await res.json();

    return (
        <>
            <h1>Users</h1>
            <p>{new Date().toLocaleTimeString()}</p>
            <ul>
                {users.map((user: User) => (
                    <li key={user.id}>
                        {user.name} - {user.email}
                    </li>
                ))}
            </ul>
        </>
    );
};
