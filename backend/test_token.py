print("Program Started")

from core.security import create_access_token

print("Imported Successfully")

token = create_access_token({
    "email": "vishwesh@gmail.com"
})

print(token)
print("Finished")