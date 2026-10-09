import json
import os
from datetime import date

FILE_NAME = "productivity_data.json"


def load_data():
    if os.path.exists(FILE_NAME):
        try:
            with open(FILE_NAME, "r") as file:
                return json.load(file)
        except (ValueError, IOError):
            pass

    return {"tasks": [], "goals": []}


def save_data():
    with open(FILE_NAME, "w") as file:
        json.dump(data, file, indent=4)


data = load_data()


def next_id(records):
    if not records:
        return 1
    return max(item["id"] for item in records) + 1


def add_task():
    title = input("Enter task title: ").strip()

    if not title:
        print("Task title cannot be empty.")
        return

    print("Priority: 1. High  2. Medium  3. Low")
    choice = input("Choose priority: ")

    priorities = {"1": "High", "2": "Medium", "3": "Low"}
    priority = priorities.get(choice, "Medium")

    deadline = input("Enter deadline (YYYY-MM-DD): ")

    try:
        date.fromisoformat(deadline)
    except ValueError:
        print("Invalid date. Use YYYY-MM-DD.")
        return

    print("Status: 1. Not Started  2. In Progress  3. Completed")
    status_choice = input("Choose status: ")

    statuses = {
        "1": "Not Started",
        "2": "In Progress",
        "3": "Completed"
    }
    status = statuses.get(status_choice, "Not Started")

    task = {
        "id": next_id(data["tasks"]),
        "title": title,
        "priority": priority,
        "deadline": deadline,
        "status": status
    }

    data["tasks"].append(task)
    save_data()
    print("Task added successfully!")


def view_tasks():
    if not data["tasks"]:
        print("No tasks available.")
        return

    print("\n----------- YOUR TASKS -----------")

    for task in data["tasks"]:
        status = task["status"]

        if status != "Completed" and task["deadline"] < date.today().isoformat():
            status = "Overdue"

        print("\nTask ID:", task["id"])
        print("Title:", task["title"])
        print("Priority:", task["priority"])
        print("Deadline:", task["deadline"])
        print("Status:", status)


def update_task():
    view_tasks()

    try:
        task_id = int(input("\nEnter task ID to update: "))
    except ValueError:
        print("Enter a valid numeric ID.")
        return

    for task in data["tasks"]:
        if task["id"] == task_id:
            print("1. Update title")
            print("2. Update priority")
            print("3. Update deadline")
            print("4. Update status")

            choice = input("Choose option: ")

            if choice == "1":
                title = input("Enter new title: ").strip()
                if title:
                    task["title"] = title

            elif choice == "2":
                print("1. High  2. Medium  3. Low")
                p = input("Choose priority: ")
                priorities = {
                    "1": "High", "2": "Medium", "3": "Low"
                }
                if p in priorities:
                    task["priority"] = priorities[p]

            elif choice == "3":
                deadline = input("Enter new deadline (YYYY-MM-DD): ")
                try:
                    date.fromisoformat(deadline)
                    task["deadline"] = deadline
                except ValueError:
                    print("Invalid date.")
                    return

            elif choice == "4":
                print("1. Not Started")
                print("2. In Progress")
                print("3. Completed")
                s = input("Choose status: ")

                statuses = {
                    "1": "Not Started",
                    "2": "In Progress",
                    "3": "Completed"
                }
                if s in statuses:
                    task["status"] = statuses[s]

            else:
                print("Invalid option.")
                return

            save_data()
            print("Task updated successfully!")
            return

    print("Task ID not found.")


def delete_task():
    view_tasks()

    try:
        task_id = int(input("\nEnter task ID to delete: "))
    except ValueError:
        print("Enter a valid numeric ID.")
        return

    for task in data["tasks"]:
        if task["id"] == task_id:
            data["tasks"].remove(task)
            save_data()
            print("Task deleted successfully!")
            return

    print("Task ID not found.")


def add_goal():
    title = input("Enter your goal: ").strip()

    if not title:
        print("Goal cannot be empty.")
        return

    deadline = input("Enter target date (YYYY-MM-DD): ")

    try:
        date.fromisoformat(deadline)
    except ValueError:
        print("Invalid date. Use YYYY-MM-DD.")
        return

    goal = {
        "id": next_id(data["goals"]),
        "title": title,
        "deadline": deadline
    }

    data["goals"].append(goal)
    save_data()
    print("Goal added successfully!")


def view_goals():
    if not data["goals"]:
        print("No goals available.")
        return

    print("\n----------- YOUR GOALS -----------")

    for goal in data["goals"]:
        print("\nGoal ID:", goal["id"])
        print("Goal:", goal["title"])
        print("Target date:", goal["deadline"])


def dashboard():
    tasks = data["tasks"]
    total = len(tasks)
    completed = sum(
        1 for task in tasks
        if task["status"] == "Completed"
    )
    pending = total - completed

    overdue = sum(
        1 for task in tasks
        if task["status"] != "Completed"
        and task["deadline"] < date.today().isoformat()
    )

    rate = 0
    if total > 0:
        rate = completed * 100 // total

    print("\n======= DAILY PRODUCTIVITY DASHBOARD =======")
    print("Date:", date.today())
    print("Total tasks:", total)
    print("Completed tasks:", completed)
    print("Pending tasks:", pending)
    print("Overdue tasks:", overdue)
    print("Completion rate:", str(rate) + "%")
    print("Total goals:", len(data["goals"]))


while True:
    print("\n========== MAIN MENU ==========")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Update Task")
    print("4. Delete Task")
    print("5. Add Goal")
    print("6. View Goals")
    print("7. Productivity Dashboard")
    print("8. Exit")

    choice = input("Enter your choice: ")

    if choice == "1":
        add_task()
    elif choice == "2":
        view_tasks()
    elif choice == "3":
        update_task()
    elif choice == "4":
        delete_task()
    elif choice == "5":
        add_goal()
    elif choice == "6":
        view_goals()
    elif choice == "7":
        dashboard()
    elif choice == "8":
        print("Thank you for using Daily Productivity Dashboard!")
        break
    else:
        print("Invalid choice. Please try again.")
