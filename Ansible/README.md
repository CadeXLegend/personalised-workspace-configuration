# Ansible Automated Environment Setup

> [!TIP]
> You can selectively install what you want by defining each task you want in the tags parameter
> By default, it will run all tasks

## Installing Ansible

1. Ensure you have python3 installed
2. Ensure you have pip installed
3. Install Ansible at its most lightweight

    ```shell
    python3 -m pip install --user ansible-core
    ```

4. Install dependencies

    ```shell
    ansible-galaxy collection install -r requirements.yml
    ```

## Configuring Installations

Take a look at [config.yml](./config.yml)

You can customise it however you please

I've set it up to be the default of how I like it

## Running Ansible

To run this playbook, run the command(s) below

    ```shell
    # default install with all tasks
    ansible-playbook playbook.yml --ask-become-pass

    # selective install of specific packages
    ansible-playbook playbook.yml --tags "cargo,create-directories" --ask-become-pass

    # to debug any issues, enable verbosity levels
    ansible-playbook playbook.yml --ask-become-pass -vv   # surface level json styled info
    ansible-playbook playbook.yml --ask-become-pass -vvv  # more granular command info
    ansible-playbook playbook.yml --ask-become-pass -vvvv # detailed output from everything
    ```
